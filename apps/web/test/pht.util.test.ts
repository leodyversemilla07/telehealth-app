import { toPHT, toPHTDate, toPHTTime, phtToUTC, formatPHTFull, PHT_OFFSET_HOURS } from "@workspace/shared"

describe("PHT Timezone Utilities", () => {
  // Known UTC → PHT conversion: 2026-05-30T06:30:00.000Z = May 30, 2026 2:30 PM PHT
  const utcDate = new Date("2026-05-30T06:30:00.000Z")

  describe("toPHT", () => {
    it("should convert UTC to PHT locale string", () => {
      const result = toPHT(utcDate)
      expect(result).toContain("2026")
      // PHT is UTC+8, so 06:30 UTC = 14:30 PHT
      expect(result).toContain("2:30")
    })

    it("should accept ISO string input", () => {
      const result = toPHT("2026-05-30T06:30:00.000Z")
      expect(result).toContain("2:30")
    })
  })

  describe("toPHTDate", () => {
    it("should return YYYY-MM-DD format in PHT", () => {
      const result = toPHTDate(utcDate)
      expect(result).toBe("2026-05-30")
    })

    it("should handle date rollover at midnight PHT", () => {
      // 2026-05-30T16:00:00.000Z = May 31, 2026 00:00 PHT
      const nearMidnight = new Date("2026-05-30T16:00:00.000Z")
      const result = toPHTDate(nearMidnight)
      expect(result).toBe("2026-05-31")
    })
  })

  describe("toPHTTime", () => {
    it("should return HH:mm in 24h format PHT", () => {
      const result = toPHTTime(utcDate)
      expect(result).toBe("14:30")
    })
  })

  describe("phtToUTC", () => {
    it("should convert PHT date+time back to correct UTC Date", () => {
      const result = phtToUTC("2026-05-30", "14:30")
      // 14:30 PHT = 06:30 UTC
      expect(result.toISOString()).toBe("2026-05-30T06:30:00.000Z")
    })

    it("should handle midnight PHT correctly", () => {
      const result = phtToUTC("2026-05-30", "00:00")
      // 00:00 PHT = 16:00 UTC previous day
      expect(result.toISOString()).toBe("2026-05-29T16:00:00.000Z")
    })
  })

  describe("formatPHTFull", () => {
    it("should produce a human-readable PHT string with timezone", () => {
      const result = formatPHTFull(utcDate)
      expect(result).toContain("May")
      expect(result).toContain("2026")
      expect(result).toMatch(/GMT\+8|PHT/)
    })
  })

  describe("PHT_OFFSET_HOURS", () => {
    it("should be 8 (UTC+8, no DST in PH)", () => {
      expect(PHT_OFFSET_HOURS).toBe(8)
    })
  })
})
