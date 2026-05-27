/**
 * Philippine Standard Time (PHT) — Asia/Manila, UTC+8
 *
 * Shared utility for both API and Web.
 * SRS §5.1: "All times displayed in Philippine Standard Time (UTC+8)"
 */

export const PHT_TZ = "Asia/Manila"
export const PHT_OFFSET_HOURS = 8

/** Format a UTC Date/string to PHT datetime string */
export function toPHT(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-PH", { timeZone: PHT_TZ, ...opts })
}

/** Format a Date to PHT date only (YYYY-MM-DD) */
export function toPHTDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-CA", { timeZone: PHT_TZ })
}

/** Format a Date to PHT time only (HH:mm, 24h) */
export function toPHTTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-PH", {
    timeZone: PHT_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

/** Full formatted PHT string: "May 30, 2026, 02:30 PM GMT+8" */
export function formatPHTFull(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-PH", {
    timeZone: PHT_TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  })
}

/** Create a PHT Date from date+time strings (inverse of display) */
export function phtToUTC(dateStr: string, timeStr: string): Date {
  const fake = new Date(`${dateStr}T${timeStr}:00.000Z`)
  return new Date(fake.getTime() - PHT_OFFSET_HOURS * 60 * 60_000)
}
