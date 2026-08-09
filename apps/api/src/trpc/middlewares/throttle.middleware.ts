import { Injectable } from "@nestjs/common"
import { TRPCError } from "@trpc/server"
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc"

/**
 * Extract the trusted client IP from the request, mirroring packages/auth
 * (trustedClientIp): only the hop the backend's own proxy appends is trusted.
 * Behind nginx that is the LAST x-forwarded-for value (or x-real-ip /
 * cf-connecting-ip when the proxy sets those). The FIRST x-forwarded-for value
 * is client-supplied and trivially spoofable, so it is never used.
 */
function trustedClientIp(
  req?: { ip?: string; headers?: Record<string, unknown> } | null,
): string | null {
  const headers = req?.headers as Record<string, string | string[] | undefined>
  if (!headers) return req?.ip ?? null

  const cf = headers["cf-connecting-ip"]
  if (typeof cf === "string" && cf.trim() !== "") return cf.trim()

  const xff = headers["x-forwarded-for"]
  if (typeof xff === "string") {
    const last = xff.split(",").pop()?.trim()
    if (last) return last
  } else if (Array.isArray(xff)) {
    const last = xff[xff.length - 1]
    if (last && last.trim() !== "") return last.trim()
  }

  const realIp = headers["x-real-ip"]
  if (typeof realIp === "string" && realIp.trim() !== "") return realIp.trim()

  return req?.ip ?? null
}

/**
 * Fixed-window rate limiting for tRPC procedures, mirroring the REST-side
 * ThrottlerModule config (SRS NFR-SEC-05: 30 requests / 60s, override with
 * THROTTLE_LIMIT). The global ThrottlerGuard does not run for tRPC.
 *
 * Keyed by the proxy-trusted client IP (last XFF hop) + procedure path, so
 * real per-user limits survive the nginx hop instead of collapsing every
 * client into the socket address (127.0.0.1). Requests without any forwarded
 * headers (e.g. Next.js server-side calls) fall back to the socket address,
 * which keeps the internal SSR path on its own shared bucket.
 *
 * In-memory store. pm2 runs the API as a single fork, so an in-process store
 * is accurate; entries are lazily pruned every SWEEP_INTERVAL_MS so the map
 * does not grow without bound over days of uptime.
 */
@Injectable()
export class ThrottleMiddleware implements TRPCMiddleware {
  private static readonly SWEEP_INTERVAL_MS = 30_000

  private readonly windows = new Map<
    string,
    { count: number; resetAt: number }
  >()
  private lastSweepAt = 0

  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ttlMs = 60_000
    const limit = Number(process.env.THROTTLE_LIMIT ?? 30)
    const now = Date.now()

    this.sweepIfDue(now)

    const ctx = opts.ctx as {
      req?: { ip?: string; headers?: Record<string, unknown> } | null
    }
    const ip = trustedClientIp(ctx.req) ?? "anonymous"
    const key = `${ip}:${opts.path}`

    const entry = this.windows.get(key)
    if (!entry || entry.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + ttlMs })
      return opts.next()
    }

    entry.count += 1
    if (entry.count > limit) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests — please try again in a minute",
      })
    }

    return opts.next()
  }

  /** Drop expired windows; bounded every 30s so a busy map stays small. */
  private sweepIfDue(now: number): void {
    if (now - this.lastSweepAt < ThrottleMiddleware.SWEEP_INTERVAL_MS) return
    this.lastSweepAt = now
    for (const [key, entry] of this.windows) {
      if (entry.resetAt <= now) this.windows.delete(key)
    }
  }
}
