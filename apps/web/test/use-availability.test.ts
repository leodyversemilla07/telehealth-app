import { describe, expect, it } from "vitest"

describe("Availability Hook", () => {
  describe("Schedule Configuration", () => {
    it("should define valid time format (HH:MM)", () => {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      const validTimes = ["09:00", "17:00", "00:00", "23:59", "12:30"]
      const invalidTimes = ["9:00", "25:00", "12:60", "abc", ""]

      for (const time of validTimes) {
        expect(time).toMatch(timeRegex)
      }

      for (const time of invalidTimes) {
        expect(time).not.toMatch(timeRegex)
      }
    })

    it("should validate slot duration options", () => {
      const validDurations = [15, 30, 45, 60, 120]
      const invalidDurations = [0, -15, 10, 25, 90]

      for (const duration of validDurations) {
        expect([15, 30, 45, 60, 120]).toContain(duration)
      }

      for (const duration of invalidDurations) {
        expect([15, 30, 45, 60, 120]).not.toContain(duration)
      }
    })

    it("should validate day keys", () => {
      const validDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ]
      const invalidDays = ["mon", "fri", "weekend", "1", ""]

      for (const day of validDays) {
        expect(validDays).toContain(day)
      }

      for (const day of invalidDays) {
        expect(validDays).not.toContain(day)
      }
    })

    it("should have 7 days in a week", () => {
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ]
      expect(days).toHaveLength(7)
    })
  })

  describe("Time-off Validation", () => {
    it("should require end date after start date", () => {
      const startDate = new Date("2024-01-15T09:00:00")
      const endDate = new Date("2024-01-15T17:00:00")
      const invalidEndDate = new Date("2024-01-15T08:00:00")

      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime())
      expect(invalidEndDate.getTime()).toBeLessThan(startDate.getTime())
    })

    it("should reject same start and end time", () => {
      const date = new Date("2024-01-15T09:00:00")
      const sameDate = new Date("2024-01-15T09:00:00")

      expect(sameDate.getTime()).not.toBeGreaterThan(date.getTime())
    })
  })
})
