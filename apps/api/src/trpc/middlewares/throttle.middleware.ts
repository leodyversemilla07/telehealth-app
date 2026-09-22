import { Injectable } from "@nestjs/common"
import { TRPCError } from "@trpc/server"
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc"
import { RedisService } from "../../redis/redis.service"

/**
 * Extract the trusted client IP from the request, mirroring packages/auth
 * (trustedClientIp): only the hop the backend's own proxy appends is trusted.
 * Behind nginx that is the LAST x-forwarded-for value appended by the
 * trusted proxy. Standalone client-supplied cf-connecting-ip and x-real-ip
 * headers are deliberately ignored.
 */
function trustedClientIp(
  req?: { ip?: string; headers?: Record<string, unknown> } | null,
): string | null {
  const headers = req?.headers as Record<string, string | string[] | undefined>
  if (!headers) return req?.ip ?? null

  const xff = headers["x-forwarded-for"]
  if (typeof xff === "string") {
    const last = xff.split(",").pop()?.trim()
    if (last) return last
  } else if (Array.isArray(xff)) {
    const last = xff[xff.length - 1]
    if (last && last.trim() !== "") return last.trim()
  }

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
 * RedisService provides a shared store when REDIS_URL is configured and a
 * bounded in-memory fallback for local/test single-instance deployments.
 */
@Injectable()
export class ThrottleMiddleware implements TRPCMiddleware {
  constructor(private readonly rateLimits: RedisService) {}

  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ttlMs = 60_000
    const limit = Number(process.env.THROTTLE_LIMIT ?? 30)
    const ctx = opts.ctx as {
      req?: { ip?: string; headers?: Record<string, unknown> } | null
    }
    const ip = trustedClientIp(ctx.req) ?? "anonymous"
    const record = await this.rateLimits.increment(
      `${ip}:${opts.path}`,
      ttlMs,
      limit,
      ttlMs,
      "trpc",
    )

    if (record.isBlocked) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests — please try again in a minute",
      })
    }

    return opts.next()
  }
}
