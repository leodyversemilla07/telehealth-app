/**
 * Robust parsing of API date fields.
 *
 * The API's global PhtDateInterceptor converts every `Date` in a response to
 * a human-readable PHT string ("May 30, 2026, 02:33 PM GMT+8"), whose format
 * depends on the runtime's Intl implementation (Safari's strict Date.parse
 * can reject it). Alongside that string the interceptor also emits a
 * parseable `<field>_utc` ISO-8601 key. We prefer `_utc` and fall back to the
 * raw value so client-side data (e.g. socket-delivered ISO timestamps) still
 * parse.
 *
 * Returns a Date that is `NaN`-invalid when the field is missing/unparseable,
 * which `.toLocale*()` renders as "Invalid Date" instead of throwing.
 * Guarded call sites can use `Number.isNaN(date.getTime())`.
 */
export function toDate(value: unknown, key: string): Date {
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const raw = (obj[`${key}_utc`] ?? obj[key]) as unknown
    if (typeof raw === "string" && raw) {
      const d = new Date(raw)
      if (!Number.isNaN(d.getTime())) return d
    }
  }
  return new Date(NaN)
}
