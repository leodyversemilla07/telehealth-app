/**
 * Format a user's full name from their individual name parts.
 * Falls back to `name` if individual parts are not available.
 */
export function formatFullName(user: {
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  name?: string | null
}): string {
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean)
  if (parts.length > 0) {
    return parts.join(" ")
  }
  return user.name ?? "Unknown"
}

/**
 * Format a user's abbreviated name (e.g. "John D." or just first name).
 */
export function formatShortName(user: {
  firstName?: string | null
  lastName?: string | null
  name?: string | null
}): string {
  if (user.firstName) {
    return user.lastName
      ? `${user.firstName} ${user.lastName.charAt(0)}.`
      : user.firstName
  }
  return user.name ?? "Unknown"
}

/**
 * Extract initials from a user's name for avatar fallbacks.
 */
export function getUserInitials(user: {
  firstName?: string | null
  lastName?: string | null
  name?: string | null
}): string {
  if (user.firstName) {
    const first = user.firstName.charAt(0).toUpperCase()
    const last = user.lastName?.charAt(0).toUpperCase()
    return last ? `${first}${last}` : first
  }
  const nameStr = user.name ?? ""
  const parts = nameStr.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${(parts[0] ?? "").charAt(0)}${(parts[1] ?? "").charAt(0)}`.toUpperCase()
  }
  return nameStr.charAt(0).toUpperCase() || "?"
}
