/**
 * Philippine Standard Time (PHT) — Asia/Manila, UTC+8
 *
 * SRS §5.1: "All times displayed in Philippine Standard Time (UTC+8)"
 * SRS Appendix D: "Timestamps in PHT"
 */

export const PHT_TZ = "Asia/Manila"

/** Offset constant — PHT is always UTC+8 (PH does not observe DST) */
export const PHT_OFFSET_HOURS = 8

/**
 * Convert a UTC Date/string to a PHT-formatted string.
 * Uses Intl.DateTimeFormat for reliable timezone conversion.
 */
export function toPHT(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-PH", { timeZone: PHT_TZ, ...opts })
}

/**
 * Format a Date to PHT date only (YYYY-MM-DD).
 */
export function toPHTDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-CA", { timeZone: PHT_TZ }) // en-CA gives YYYY-MM-DD
}

/**
 * Format a Date to PHT time only (HH:mm).
 */
export function toPHTTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-PH", {
    timeZone: PHT_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

/**
 * Get the current Date & time in PHT as a JS Date shifted by +8h.
 * Useful when you need a Date object representing "now in Manila".
 * NOTE: The Date object internally stores milliseconds since epoch (UTC),
 * so this shifts the epoch value — use only for display comparisons.
 */
export function nowPHT(): Date {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  return new Date(utcMs + PHT_OFFSET_HOURS * 60 * 60_000)
}

/**
 * Create a Date in PHT from a date string + time string.
 * Input: "2026-05-30", "14:30" → 2026-05-30T06:30:00.000Z (UTC)
 * This is the inverse: given a local PHT date+time, produce the correct UTC Date.
 */
export function phtToUTC(dateStr: string, timeStr: string): Date {
  // Construct as if UTC, then subtract 8h to get true UTC
  const fake = new Date(`${dateStr}T${timeStr}:00.000Z`)
  return new Date(fake.getTime() - PHT_OFFSET_HOURS * 60 * 60_000)
}

/**
 * Format a UTC Date to a full PHT datetime string suitable for API responses.
 * Output: "2026-05-30 02:30 PM (PHT)"
 */
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
