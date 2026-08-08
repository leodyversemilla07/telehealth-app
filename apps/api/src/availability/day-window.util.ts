const WINDOW_RE = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/

function isWindowEntry(entry: unknown): boolean {
  if (typeof entry !== "string") return false
  const match = WINDOW_RE.exec(entry)
  if (!match) return false

  const startHour = Number(match[1])
  const startMin = Number(match[2])
  const endHour = Number(match[3])
  const endMin = Number(match[4])

  // Start must be a real clock time (00:00-23:59); end may be "24:00".
  if (startHour > 23 || endHour > 24 || startMin > 59 || endMin > 59) {
    return false
  }

  const start = startHour * 60 + startMin
  const end = endHour * 60 + endMin
  return end > start && end <= 24 * 60
}

/**
 * Validate a stored day-schedule string: it must be a JSON array of
 * "HH:MM-HH:MM" windows with end strictly after start, within the 24h day.
 *
 * The appointments service JSON.parses these strings and treats any parse
 * failure or non-array as "no windows" — which silently makes the doctor
 * unbookable. This validator is the guard at write time (zod contract +
 * class-validator DTO), so a malformed-but-JSON-valid value like
 * `"09:00-17:00"` (a plain string) or `["09:00-17:00","99:00-100:00"]`
 * is rejected with a clear error instead of bricking the schedule.
 */
export function isValidDayWindowJson(value: unknown): boolean {
  if (typeof value !== "string") return false

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return false
  }

  return Array.isArray(parsed) && parsed.every(isWindowEntry)
}
