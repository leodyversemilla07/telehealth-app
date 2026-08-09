import { describe, expect, it } from "vitest"
import { getPageItems } from "@/lib/page-items"

describe("getPageItems", () => {
  it("returns every page when totalPages <= 7", () => {
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(5, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("keeps first and last always visible with a middle window", () => {
    expect(getPageItems(5, 10)).toEqual([
      1,
      "start-ellipsis",
      4,
      5,
      6,
      "end-ellipsis",
      10,
    ])
    expect(getPageItems(1, 10)).toEqual([1, 2, "end-ellipsis", 10])
    expect(getPageItems(10, 10)).toEqual([1, "start-ellipsis", 9, 10])
  })

  it("inserts the start ellipsis when a gap precedes the window", () => {
    const items = getPageItems(6, 12)
    expect(items[0]).toBe(1)
    expect(items[1]).toBe("start-ellipsis")
    expect(items).toContain(12)
  })

  it("inserts the end ellipsis when the window ends early", () => {
    const items = getPageItems(2, 12)
    expect(items).toContain("end-ellipsis")
    expect(items[items.length - 1]).toBe(12)
    expect(items).toContain(1)
    expect(items).toContain(3)
  })

  it("shows no ellipsis when the window covers everything", () => {
    const items = getPageItems(4, 7)
    expect(items).not.toContain("start-ellipsis")
    expect(items).not.toContain("end-ellipsis")
  })

  it("handles currentPage at the very start and end", () => {
    expect(getPageItems(1, 9)).toEqual([1, 2, "end-ellipsis", 9])
    expect(getPageItems(9, 9)).toEqual([1, "start-ellipsis", 8, 9])
  })
})
