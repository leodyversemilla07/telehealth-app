import { dateTransformer } from "@workspace/shared/utils/date-transformer"

describe("dateTransformer", () => {
  it("round-trips nested Date values", () => {
    const startTime = new Date("2026-08-14T04:00:00.000Z")
    const payload = {
      startTime,
      nested: [{ endTime: new Date("2026-08-14T04:30:00.000Z") }],
    }

    const serialized = dateTransformer.serialize(payload)
    const result = dateTransformer.deserialize(serialized) as typeof payload

    expect(result.startTime).toBeInstanceOf(Date)
    expect(result.startTime.toISOString()).toBe(startTime.toISOString())
    expect(result.nested[0]?.endTime).toBeInstanceOf(Date)
    expect(result.nested[0]?.endTime.toISOString()).toBe(
      "2026-08-14T04:30:00.000Z",
    )
  })

  it("does not reinterpret ordinary strings as dates", () => {
    const payload = { note: "2026-08-14T04:00:00.000Z" }

    expect(
      dateTransformer.deserialize(dateTransformer.serialize(payload)),
    ).toEqual(payload)
  })
})
