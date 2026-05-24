import { APP_GUARD } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModuleOptions } from "@nestjs/throttler"

/**
 * Throttler configuration: limit repeated requests to protect the API
 * from brute-force and DoS attacks.
 *
 * Default: 30 requests per 60-second window.
 */
export const throttlerConfig: ThrottlerModuleOptions = [
  {
    ttl: 60_000, // 60-second window
    limit: 30, // max 30 requests per window
  },
]

/**
 * Global provider for the throttler guard.
 * Apply at the module level or per-route via `@SkipThrottle()`.
 */
export const throttlerGuardProvider = {
  provide: APP_GUARD,
  useClass: ThrottlerGuard,
}
