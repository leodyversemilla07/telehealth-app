import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import { Observable, map } from "rxjs"
import { formatPHTFull } from "@/common/utils/pht.util"

/**
 * PhtDateInterceptor
 *
 * Recursively walks through API response objects and converts any Date values
 * to PHT-formatted strings: "May 30, 2026, 02:30 PM GMT+8"
 *
 * This ensures all timestamps returned to clients comply with:
 *   SRS §5.1: "All times displayed in Philippine Standard Time (UTC+8)"
 *   SRS Appendix D: "Timestamps in PHT"
 *
 * The original ISO timestamps are preserved under an `_utc` key for
 * programmatic consumers that need raw UTC.
 */
@Injectable()
export class PhtDateInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.transformDates(data)))
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
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (val instanceof Date) {
          // Keep UTC ISO string under _utc key, PHT string as main value
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
