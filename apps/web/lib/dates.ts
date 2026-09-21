/**
 * Robust parsing of API date fields.
 *
 * tRPC responses preserve actual Date objects through the shared transformer,
 * while REST and socket payloads use ISO-8601 strings. Legacy responses may
 * also contain a `<field>_utc` value, so prefer it when present.
 *
 * Returns a Date that is `NaN`-invalid when the field is missing/unparseable,
 * which `.toLocale*()` renders as "Invalid Date" instead of throwing.
 * Guarded call sites can use `Number.isNaN(date.getTime())`.
 */
export function toDate(value: unknown, key: string): Date {
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const raw = (obj[`${key}_utc`] ?? obj[key]) as unknown
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
      return raw
    }
    if (typeof raw === "string" && raw) {
      const d = new Date(raw)
      if (!Number.isNaN(d.getTime())) return d
    }
  }
  return new Date(NaN)
}
