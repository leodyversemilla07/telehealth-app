import type { ExecutionContext } from "@nestjs/common"
import { lastValueFrom, of } from "rxjs"
import { PhtDateInterceptor } from "./pht-date.interceptor"

describe("PhtDateInterceptor", () => {
  let interceptor: PhtDateInterceptor
  // The Express-style request/response shapes aren't used by this interceptor.
  const context = {} as ExecutionContext

  beforeEach(() => {
    interceptor = new PhtDateInterceptor()
  })

  async function run(value: unknown): Promise<unknown> {
    const callHandler = { handle: () => of(value) }
    return lastValueFrom(
      interceptor.intercept(context, callHandler as never) as never,
    )
  }

  it("converts a top-level Date to a PHT string", async () => {
    const out = await run(new Date("2026-08-02T06:00:00.000Z"))
    expect(typeof out).toBe("string")
    expect(String(out)).toContain("2026")
  })

  it("converts nested Dates and preserves UTC under _utc", async () => {
    const out = (await run({
      id: "apt-1",
      startTime: new Date("2026-08-02T06:00:00.000Z"),
      patient: { name: "Ana" },
    })) as Record<string, unknown>

    expect(typeof out.startTime).toBe("string")
    expect(out.startTime_utc).toBe("2026-08-02T06:00:00.000Z")
    expect(out.patient).toEqual({ name: "Ana" })
  })

  it("recurses through arrays of objects", async () => {
    const out = (await run([
      { when: new Date("2026-08-02T06:00:00.000Z") },
      { when: new Date("2026-08-03T06:00:00.000Z") },
    ])) as Array<Record<string, unknown>>

    expect(typeof out[0].when).toBe("string")
    expect(out[0].when_utc).toBe("2026-08-02T06:00:00.000Z")
    expect(typeof out[1].when).toBe("string")
  })

  it("leaves primitives, null, arrays of primitives untouched", async () => {
    expect(await run(null)).toBeNull()
    expect(await run(42)).toBe(42)
    expect(await run("hello")).toBe("hello")
    expect(await run([1, "two", null])).toEqual([1, "two", null])
  })

  it("handles an empty array", async () => {
    expect(await run([])).toEqual([])
  })

  it("handles a Date nested inside a plain array primitive slot", async () => {
    const out = (await run([new Date("2026-08-02T06:00:00.000Z")])) as unknown[]
    expect(typeof out[0]).toBe("string")
  })
})
