import { APP_GUARD } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModuleOptions } from "@nestjs/throttler"

/**
 * Throttler configuration: limit repeated requests to protect the API
 * from brute-force and DoS attacks.
 *
 * Default (SRS NFR-SEC-05): 30 requests per 60-second window.
 * Override with THROTTLE_LIMIT (e.g. raised for E2E runs in playwright.config.ts).
 */
export const throttlerConfig: ThrottlerModuleOptions = [
  {
    ttl: 60_000, // 60-second window
    limit: Number(process.env.THROTTLE_LIMIT ?? 30), // max requests per window
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
