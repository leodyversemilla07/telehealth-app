import { Injectable, Logger } from "@nestjs/common"
import { dateTransformer } from "@workspace/shared/utils/date-transformer"
import { RedisService } from "../../redis/redis.service"
import { MemoryCache } from "./memory-cache"

const CACHE_NAMESPACE = "telehealth:cache"
const DEFAULT_TTL_MS = 60_000

/**
 * Shared domain-data cache (doctor search, admin stats).
 *
 * - REDIS_URL set: values are JSON-serialized (Dates preserved via the
 *   shared dateTransformer, the same encoding tRPC uses) under
 *   `telehealth:cache:*` keys, so every API instance sees the same entries
 *   and prefix invalidation works cluster-wide.
 * - REDIS_URL absent: delegates to an in-process MemoryCache, preserving
 *   the previous single-instance behavior for local/test environments.
 *
 * Fail-OPEN by design: Redis errors degrade to recomputation (a miss),
 * never to failed requests. Rate limiting stays fail-closed in
 * RedisService — limits must hold even when Redis is sick, cache hits
 * don't have to.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private readonly memory = new MemoryCache(DEFAULT_TTL_MS)

  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.redis.configured) return this.memory.get<T>(key)
    try {
      const raw = await this.redis.cacheGet(this.namespaced(key))
      if (raw == null) return undefined
      return dateTransformer.deserialize(JSON.parse(raw)) as T
    } catch (error) {
      this.logger.warn(`Cache read failed for "${key}"; recomputing`, error)
      return undefined
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlMs: number = DEFAULT_TTL_MS,
  ): Promise<void> {
    if (!this.redis.configured) {
      this.memory.set(key, value, ttlMs)
      return
    }
    try {
      const raw = JSON.stringify(dateTransformer.serialize(value))
      await this.redis.cacheSet(
        this.namespaced(key),
        raw,
        Math.max(1, Math.ceil(ttlMs / 1000)),
      )
    } catch (error) {
      this.logger.warn(`Cache write failed for "${key}"`, error)
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!this.redis.configured) {
      this.memory.invalidate(key)
      return
    }
    try {
      await this.redis.cacheDelete([this.namespaced(key)])
    } catch (error) {
      this.logger.warn(`Cache invalidation failed for "${key}"`, error)
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    if (!this.redis.configured) {
      this.memory.invalidatePrefix(prefix)
      return
    }
    try {
      const keys = await this.redis.cacheScan(`${CACHE_NAMESPACE}:${prefix}*`)
      await this.redis.cacheDelete(keys)
    } catch (error) {
      this.logger.warn(
        `Cache prefix invalidation failed for "${prefix}"`,
        error,
      )
    }
  }

  /**
   * Drop every entry in this cache's namespace. Never touches other
   * keyspaces (rate-limit buckets live under `telehealth:ratelimit:`).
   */
  async clear(): Promise<void> {
    await this.invalidatePrefix("")
  }

  private namespaced(key: string): string {
    return `${CACHE_NAMESPACE}:${key}`
  }
}
