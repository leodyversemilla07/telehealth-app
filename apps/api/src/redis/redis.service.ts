import { createHash } from "node:crypto"
import { Injectable, Logger, type OnApplicationShutdown } from "@nestjs/common"
import type { ThrottlerStorage } from "@nestjs/throttler"
import { createAdapter } from "@socket.io/redis-adapter"
import { createClient } from "redis"
import type { Server } from "socket.io"

const RATE_LIMIT_SCRIPT = `
local block_ttl = redis.call("PTTL", KEYS[2])
if block_ttl > 0 then
  local current = tonumber(redis.call("GET", KEYS[1]) or "0")
  local window_ttl = redis.call("PTTL", KEYS[1])
  if window_ttl < 0 then window_ttl = 0 end
  return {current, window_ttl, 1, block_ttl}
end

local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local window_ttl = redis.call("PTTL", KEYS[1])

if count > tonumber(ARGV[2]) then
  redis.call("PSETEX", KEYS[2], ARGV[3], "1")
  return {count, window_ttl, 1, tonumber(ARGV[3])}
end

return {count, window_ttl, 0, 0}
`

type RedisClient = ReturnType<typeof createClient>

type MemoryWindow = {
  count: number
  resetAt: number
  blockedUntil: number
}

type RateLimitRecord = {
  totalHits: number
  timeToExpire: number
  isBlocked: boolean
  timeToBlockExpire: number
}

/**
 * Owns Redis connections used by distributed rate limiting and Socket.IO.
 *
 * Security behavior is intentional:
 * - no REDIS_URL: bounded in-memory fallback for local/test/single-instance
 * - REDIS_URL set: Redis failures are surfaced instead of silently falling
 *   back to per-process counters that could let clients bypass global limits
 * - rate-limit keys are SHA-256 hashes, so client IPs are not persisted in
 *   plaintext in Redis
 */
@Injectable()
export class RedisService implements ThrottlerStorage, OnApplicationShutdown {
  private static readonly SWEEP_INTERVAL_MS = 30_000

  private readonly logger = new Logger(RedisService.name)
  private readonly redisUrl = this.normalizeUrl(process.env.REDIS_URL)
  private readonly memoryWindows = new Map<string, MemoryWindow>()
  private readonly clients = new Set<RedisClient>()
  private commandClient: RedisClient | null = null
  private commandConnectPromise: Promise<void> | null = null
  private socketAdapterConfigured = false
  private lastSweepAt = 0

  get configured(): boolean {
    return this.redisUrl !== null
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<RateLimitRecord> {
    const safeTtl = Math.max(1, Math.floor(ttl))
    const safeLimit = Math.max(1, Math.floor(limit))
    const safeBlockDuration = Math.max(1, Math.floor(blockDuration || ttl))
    const storageKey = this.rateLimitKey(throttlerName, key)

    if (!this.redisUrl) {
      return this.incrementMemory(
        storageKey,
        safeTtl,
        safeLimit,
        safeBlockDuration,
      )
    }

    const client = await this.getCommandClient()
    const raw = await client.eval(RATE_LIMIT_SCRIPT, {
      keys: [storageKey, `${storageKey}:blocked`],
      arguments: [
        String(safeTtl),
        String(safeLimit),
        String(safeBlockDuration),
      ],
    })
    const values = raw as number[]

    return {
      totalHits: Number(values[0] ?? 0),
      timeToExpire: this.millisecondsToSeconds(Number(values[1] ?? 0)),
      isBlocked: Number(values[2] ?? 0) === 1,
      timeToBlockExpire: this.millisecondsToSeconds(Number(values[3] ?? 0)),
    }
  }

  /** Attach the Redis adapter so rooms and broadcasts span API instances. */
  async configureSocketIo(server: Server): Promise<boolean> {
    if (!this.redisUrl) {
      if (process.env.NODE_ENV === "production") {
        this.logger.warn(
          "REDIS_URL is not configured; rate limits and Socket.IO are single-instance only",
        )
      }
      return false
    }
    if (this.socketAdapterConfigured) return true

    // Connect the command client first. This makes a configured-but-unreachable
    // Redis instance fail application startup rather than degrade silently.
    const commandClient = await this.getCommandClient()
    const pubClient = commandClient.duplicate()
    const subClient = commandClient.duplicate()
    this.registerClient(pubClient, "socket-publisher")
    this.registerClient(subClient, "socket-subscriber")

    try {
      await Promise.all([pubClient.connect(), subClient.connect()])
      server.adapter(createAdapter(pubClient, subClient))
      this.socketAdapterConfigured = true
      this.logger.log("Redis-backed Socket.IO adapter enabled")
      return true
    } catch (error) {
      await Promise.allSettled([
        this.closeClient(pubClient),
        this.closeClient(subClient),
      ])
      throw error
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.allSettled(
      [...this.clients].map((client) => this.closeClient(client)),
    )
    this.clients.clear()
    this.commandClient = null
    this.commandConnectPromise = null
    this.socketAdapterConfigured = false
  }

  private async getCommandClient(): Promise<RedisClient> {
    if (!this.redisUrl) {
      throw new Error("Redis is not configured")
    }

    if (!this.commandClient) {
      this.commandClient = createClient({
        url: this.redisUrl,
        socket: {
          connectTimeout: 5_000,
          reconnectStrategy: (retries) =>
            retries >= 5 ? false : Math.min(100 * 2 ** retries, 2_000),
        },
      })
      this.registerClient(this.commandClient, "rate-limit")
    }

    if (!this.commandClient.isOpen) {
      this.commandConnectPromise ??= this.commandClient
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.commandConnectPromise = null
        })
      await this.commandConnectPromise
    }

    return this.commandClient
  }

  private registerClient(client: RedisClient, purpose: string): void {
    this.clients.add(client)
    client.on("error", (error) => {
      this.logger.error(`Redis ${purpose} error`, error)
    })
  }

  private async closeClient(client: RedisClient): Promise<void> {
    if (client.isOpen) await client.quit()
    this.clients.delete(client)
  }

  private incrementMemory(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): RateLimitRecord {
    const now = Date.now()
    this.sweepMemoryIfDue(now)

    let window = this.memoryWindows.get(key)
    if (!window || (window.resetAt <= now && window.blockedUntil <= now)) {
      window = { count: 0, resetAt: now + ttl, blockedUntil: 0 }
      this.memoryWindows.set(key, window)
    }

    if (window.blockedUntil > now) {
      return {
        totalHits: window.count,
        timeToExpire: this.millisecondsToSeconds(window.resetAt - now),
        isBlocked: true,
        timeToBlockExpire: this.millisecondsToSeconds(
          window.blockedUntil - now,
        ),
      }
    }

    if (window.resetAt <= now) {
      window.count = 0
      window.resetAt = now + ttl
    }

    window.count += 1
    if (window.count > limit) {
      window.blockedUntil = now + blockDuration
    }

    return {
      totalHits: window.count,
      timeToExpire: this.millisecondsToSeconds(window.resetAt - now),
      isBlocked: window.blockedUntil > now,
      timeToBlockExpire: this.millisecondsToSeconds(window.blockedUntil - now),
    }
  }

  private sweepMemoryIfDue(now: number): void {
    if (now - this.lastSweepAt < RedisService.SWEEP_INTERVAL_MS) return
    this.lastSweepAt = now

    for (const [key, window] of this.memoryWindows) {
      if (window.resetAt <= now && window.blockedUntil <= now) {
        this.memoryWindows.delete(key)
      }
    }
  }

  private rateLimitKey(throttlerName: string, rawKey: string): string {
    const digest = createHash("sha256")
      .update(`${throttlerName}:${rawKey}`)
      .digest("hex")
    // Hash tags keep the counter and its `:blocked` companion in one Redis
    // Cluster slot, which is required for the atomic Lua script above.
    return `telehealth:ratelimit:{${digest}}`
  }

  private millisecondsToSeconds(milliseconds: number): number {
    return Math.max(0, Math.ceil(milliseconds / 1000))
  }

  private normalizeUrl(value: string | undefined): string | null {
    const normalized = value?.trim()
    return normalized ? normalized : null
  }
}
