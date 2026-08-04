import { Injectable } from "@nestjs/common"
import { TRPCError } from "@trpc/server"
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc"

/**
 * Fixed-window rate limiting for tRPC procedures, mirroring the REST-side
 * ThrottlerModule config (SRS NFR-SEC-05: 30 requests / 60s, override with
 * THROTTLE_LIMIT). The global ThrottlerGuard does not run for tRPC.
 *
 * In-memory per-IP+procedure key. pm2 runs the API as a single fork, so an
 * in-process store is accurate (same assumption as the existing setup).
 */
@Injectable()
export class ThrottleMiddleware implements TRPCMiddleware {
  private readonly windows = new Map<
    string,
    { count: number; resetAt: number }
  >()

  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ttlMs = 60_000
    const limit = Number(process.env.THROTTLE_LIMIT ?? 30)
    const now = Date.now()

    const ctx = opts.ctx as { req?: { ip?: string } }
    const ip = ctx.req?.ip ?? "anonymous"
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
}
