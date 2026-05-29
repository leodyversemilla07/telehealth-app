export function sanitize(input: string | null | undefined, maxLength = 2000): string | null {
  if (!input) return null
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, maxLength) || null
}
