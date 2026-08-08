import { describe, expect, it } from "@jest/globals"
import { isValidDayWindowJson } from "./day-window.util"

describe("isValidDayWindowJson", () => {
  it("accepts an empty schedule", () => {
    expect(isValidDayWindowJson("[]")).toBe(true)
  })

  it("accepts normal windows", () => {
    expect(isValidDayWindowJson('["09:00-17:00"]')).toBe(true)
    expect(isValidDayWindowJson('["08:30-12:00","13:00-17:30"]')).toBe(true)
  })

  it("accepts a window ending at midnight 24:00", () => {
    expect(isValidDayWindowJson('["00:00-24:00"]')).toBe(true)
    expect(isValidDayWindowJson('["14:00-24:00"]')).toBe(true)
  })

  it("rejects non-JSON strings", () => {
    expect(isValidDayWindowJson("00:00-24:00")).toBe(false)
    expect(isValidDayWindowJson("not-json")).toBe(false)
  })

  it("rejects valid JSON that is not an array (the silent-bricking case)", () => {
    expect(isValidDayWindowJson('"09:00-17:00"')).toBe(false)
    expect(isValidDayWindowJson("42")).toBe(false)
    expect(isValidDayWindowJson('{"monday":"09:00-17:00"}')).toBe(false)
  })

  it("rejects arrays with malformed entries", () => {
    expect(isValidDayWindowJson('["09:00-17:00", 12]')).toBe(false)
    expect(isValidDayWindowJson('["09-17"]')).toBe(false)
    expect(isValidDayWindowJson('["09:00-17:00", "oops"]')).toBe(false)
  })

  it("rejects out-of-range clocks and inverted windows", () => {
    expect(isValidDayWindowJson('["25:00-26:00"]')).toBe(false)
    expect(isValidDayWindowJson('["24:30-25:00"]')).toBe(false)
    expect(isValidDayWindowJson('["09:60-10:00"]')).toBe(false)
    expect(isValidDayWindowJson('["17:00-09:00"]')).toBe(false)
    expect(isValidDayWindowJson('["09:00-09:00"]')).toBe(false)
  })

  it("rejects non-strings", () => {
    expect(isValidDayWindowJson(undefined)).toBe(false)
    expect(isValidDayWindowJson(null)).toBe(false)
    expect(isValidDayWindowJson(123)).toBe(false)
  })
})
