import { afterEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/lib/api-client"

/**
 * These tests lock in the SRS NFR-REL-03 error envelope contract:
 * non-2xx responses must surface statusCode, error, code and details
 * (e.g. the 422 CANCELLATION_WINDOW and 409 SLOT_UNAVAILABLE codes
 * introduced for appointment cancellation / double-booking).
 */
function mockFetchOnce(body: unknown, status: number, ok = false) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: "",
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(body),
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("API Client — SRS error envelope (NFR-REL-03)", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("parses code and details from a 422 Unprocessable Entity response", async () => {
    mockFetchOnce(
      {
        statusCode: 422,
        timestamp: "2024-01-01T00:00:00.000Z",
        path: "/appointments/abc/cancel",
        requestId: "req-1",
        message: "Cannot cancel within the cancellation window",
        error: "Unprocessable Entity",
        code: "CANCELLATION_WINDOW",
        details: { appointmentId: "abc", hoursRemaining: 5 },
      },
      422,
    )

    await expect(
      apiClient.patch("/appointments/abc/cancel"),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: "CANCELLATION_WINDOW",
      error: "Unprocessable Entity",
      message: "Cannot cancel within the cancellation window",
      details: { appointmentId: "abc", hoursRemaining: 5 },
    })
  })

  it("parses the code from a 409 Conflict (SLOT_UNAVAILABLE) response", async () => {
    mockFetchOnce(
      {
        statusCode: 409,
        message: "Slot no longer available",
        error: "Conflict",
        code: "SLOT_UNAVAILABLE",
      },
      409,
    )

    await expect(apiClient.post("/appointments", {})).rejects.toMatchObject({
      statusCode: 409,
      code: "SLOT_UNAVAILABLE",
    })
  })

  it("joins an array message into a single string", async () => {
    mockFetchOnce(
      {
        statusCode: 400,
        message: ["name is required", "email is required"],
        error: "Bad Request",
      },
      400,
    )

    await expect(apiClient.post("/users", {})).rejects.toMatchObject({
      statusCode: 400,
      message: "name is required, email is required",
    })
  })
})
