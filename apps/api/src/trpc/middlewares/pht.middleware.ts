import { Injectable } from "@nestjs/common"
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc"
import { formatPHTFull } from "../../common/utils/pht.util"

/**
 * SRS §5.1 / Appendix D: "All times displayed in Philippine Standard Time
 * (UTC+8)".
 *
 * The global PhtDateInterceptor only wraps REST controller responses — tRPC
 * responses bypass the Nest interceptor pipeline entirely. This middleware is
 * the tRPC equivalent: it walks the returned data and converts every Date to
 * a PHT-formatted string, preserving the raw UTC ISO under `<key>_utc` so
 * programmatic consumers still have the machine-readable value.
 */
@Injectable()
export class PhtMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const result = await opts.next()
    if (!result.ok) return result

    const data = (result as { data?: unknown }).data
    return { ...result, data: this.transformDates(data) }
  }

  private transformDates(value: unknown): unknown {
    if (value instanceof Date) {
      return formatPHTFull(value)
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transformDates(item))
    }

    if (value !== null && typeof value === "object") {
      const result: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (val instanceof Date) {
          result[key] = formatPHTFull(val)
          result[`${key}_utc`] = val.toISOString()
        } else {
          result[key] = this.transformDates(val)
        }
      }
      return result
    }

    return value
  }
}
