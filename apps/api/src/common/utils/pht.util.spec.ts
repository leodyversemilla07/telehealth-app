import {
  formatPHTFull,
  nowPHT,
  PHT_OFFSET_HOURS,
  PHT_TZ,
  phtToUTC,
  toPHT,
  toPHTDate,
  toPHTTime,
} from "./pht.util"

describe("pht.util", () => {
  it("exposes the PHT constants", () => {
    expect(PHT_TZ).toBe("Asia/Manila")
    expect(PHT_OFFSET_HOURS).toBe(8)
  })

  it("toPHT renders a Date in the Manila timezone", () => {
    // 06:00 UTC == 14:00 PHT
    const out = toPHT(new Date("2026-08-02T06:00:00.000Z"))
    expect(out).toContain("2026")
    expect(out).toContain("2:00") // 14:00 in en-PH 12h format
  })

  it("toPHT accepts an ISO string", () => {
    const out = toPHT("2026-08-02T06:00:00.000Z", { hour12: false })
    expect(out).toContain("14:00")
  })

  it("toPHTDate returns the PHT calendar date (en-CA YYYY-MM-DD)", () => {
    // 2026-08-02 20:00 UTC is already 2026-08-03 in PHT
    expect(toPHTDate("2026-08-02T20:00:00.000Z")).toBe("2026-08-03")
    expect(toPHTDate(new Date("2026-08-02T06:00:00.000Z"))).toBe("2026-08-02")
  })

  it("toPHTTime returns an HH:mm time in PHT", () => {
    expect(toPHTTime("2026-08-02T06:00:00.000Z")).toBe("14:00")
    expect(toPHTTime("2026-08-02T22:30:00.000Z")).toBe("06:30")
  })

  it("nowPHT returns a Date within a day of now", () => {
    const before = Date.now() - 24 * 3600_000
    const after = Date.now() + 24 * 3600_000
    const now = nowPHT().getTime()
    expect(now).toBeGreaterThanOrEqual(before)
    expect(now).toBeLessThanOrEqual(after)
  })

  it("phtToUTC converts a PHT wall-clock time to UTC", () => {
    // 2026-05-30 14:30 PHT == 2026-05-30 06:30 UTC
    expect(phtToUTC("2026-05-30", "14:30").toISOString()).toBe(
      "2026-05-30T06:30:00.000Z",
    )
  })

  it("formatPHTFull renders a full readable PHT datetime", () => {
    const out = formatPHTFull("2026-08-02T06:00:00.000Z")
    expect(out).toContain("2026")
    expect(out).toContain("2:00") // 14:00 → "02:00 PM"
    expect(out).toMatch(/PM/i)
  })
})
