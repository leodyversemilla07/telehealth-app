import {
  getLockoutDuration,
  isLockedOut,
  LOCKOUT_DURATION_MINUTES,
  validatePasswordComplexity,
} from "./password.util"

describe("validatePasswordComplexity", () => {
  it("should reject passwords shorter than 8 characters", () => {
    expect(validatePasswordComplexity("Ab1!")).not.toBeNull()
  })

  it("should reject passwords without uppercase", () => {
    expect(validatePasswordComplexity("abcdef1!@")).not.toBeNull()
  })

  it("should reject passwords without lowercase", () => {
    expect(validatePasswordComplexity("ABCDEF1!@")).not.toBeNull()
  })

  it("should reject passwords without numbers", () => {
    expect(validatePasswordComplexity("Abcdef!@#")).not.toBeNull()
  })

  it("should reject passwords without special characters", () => {
    expect(validatePasswordComplexity("Abcdef123")).not.toBeNull()
  })

  it("should accept a valid password", () => {
    expect(validatePasswordComplexity("Abcdef1!@")).toBeNull()
  })

  it("should accept a long valid password", () => {
    expect(validatePasswordComplexity("Str0ng!P@ssw0rd#2026")).toBeNull()
  })

  it("should reject passwords over 128 characters", () => {
    expect(validatePasswordComplexity(`A1!${"a".repeat(126)}`)).not.toBeNull()
  })
})

describe("isLockedOut", () => {
  it("should return false when lockoutUntil is null", () => {
    expect(isLockedOut(null)).toBe(false)
  })

  it("should return true when lockoutUntil is in the future", () => {
    const future = new Date(Date.now() + 60_000)
    expect(isLockedOut(future)).toBe(true)
  })

  it("should return false when lockoutUntil is in the past", () => {
    const past = new Date(Date.now() - 60_000)
    expect(isLockedOut(past)).toBe(false)
  })
})

describe("getLockoutDuration", () => {
  it("should return a date 15 minutes from now", () => {
    const now = Date.now()
    const result = getLockoutDuration()
    const diff = result.getTime() - now
    expect(diff).toBeGreaterThanOrEqual(LOCKOUT_DURATION_MINUTES * 60_000 - 100)
    expect(diff).toBeLessThanOrEqual(LOCKOUT_DURATION_MINUTES * 60_000 + 100)
  })
})
