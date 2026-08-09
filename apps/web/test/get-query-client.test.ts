import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api-client"
import { makeQueryClient } from "@/lib/get-query-client"

describe("get-query-client defaults", () => {
  it("defaults staleTime to 60s and gcTime to 10min", () => {
    const client = makeQueryClient()
    const defaults = client.getDefaultOptions().queries
    expect(defaults?.staleTime).toBe(60_000)
    expect(defaults?.gcTime).toBe(10 * 60 * 1000)
  })

  it("does not refetch when the window regains focus", () => {
    const client = makeQueryClient()
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false)
  })

  it("skips retries for client-side ApiError 4xx", async () => {
    const client = makeQueryClient()
    let calls = 0
    const fn = async () => {
      calls += 1
      throw new ApiError("Bad request", 400)
    }
    await expect(
      client.fetchQuery({ queryKey: ["r1"], queryFn: fn }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(calls).toBe(1)
  })

  it("skips retries for tRPC errors carrying a 4xx httpStatus", async () => {
    const client = makeQueryClient()
    let calls = 0
    const fn = async () => {
      calls += 1
      const err = new Error("UNAUTHORIZED")
      ;(err as { data?: unknown }).data = { httpStatus: 401 }
      throw err
    }
    await expect(
      client.fetchQuery({ queryKey: ["r2"], queryFn: fn }),
    ).rejects.toThrow("UNAUTHORIZED")
    expect(calls).toBe(1)
  })

  it("retries transient 5xx errors up to 2 times", async () => {
    const client = makeQueryClient()
    let calls = 0
    const fn = async () => {
      calls += 1
      throw new ApiError("Service unavailable", 503)
    }
    await expect(
      client.fetchQuery({ queryKey: ["r3"], queryFn: fn }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(calls).toBe(3) // initial + 2 retries
  })

  it("retries plain errors up to 2 times", async () => {
    const client = makeQueryClient()
    let calls = 0
    const fn = async () => {
      calls += 1
      throw new Error("boom")
    }
    await expect(
      client.fetchQuery({ queryKey: ["r4"], queryFn: fn }),
    ).rejects.toThrow("boom")
    expect(calls).toBe(3)
  })

  it("retains the last data when a background refetch fails", async () => {
    const client = makeQueryClient()
    await client.fetchQuery({ queryKey: ["r5"], queryFn: async () => 42 })
    await expect(
      client.fetchQuery({
        queryKey: ["r5"],
        queryFn: async () => {
          throw new ApiError("server down", 503)
        },
        staleTime: 0, // force a refetch of the cached query
        retry: 1,
      }),
    ).rejects.toBeInstanceOf(ApiError)
    // Client data survives the stale refresh — the UI never blanks.
    expect(client.getQueryData(["r5"])).toBe(42)
  })
})
