export function formatPHTFull(date: Date | string | undefined): string {
  if (!date) return ""
  return typeof date === "string" ? date : date.toISOString()
}
