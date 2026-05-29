export const LOCKOUT_THRESHOLD = 5
export const LOCKOUT_DURATION_MINUTES = 15

export function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long."
  }
  if (password.length > 128) {
    return "Password must be at most 128 characters long."
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter."
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter."
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number."
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character."
  }
  return null
}

export function isLockedOut(lockoutUntil: Date | null): boolean {
  if (!lockoutUntil) return false
  return lockoutUntil > new Date()
}

export function getLockoutDuration(): Date {
  return new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
}
