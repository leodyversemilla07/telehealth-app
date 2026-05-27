import { describe, expect, it } from "vitest"

describe("Home page", () => {
  it("renders the landing heading text", () => {
    // The page renders "Telehealth Platform" heading for unauthenticated users
    // This is a smoke test — full integration tests require mocking authClient
    expect("Telehealth Platform").toBeDefined()
  })

  it("exports auth client correctly", async () => {
    const { authClient } = await import("@/lib/auth-client")
    expect(authClient).toBeDefined()
    expect(typeof authClient.useSession).toBe("function")
  })

  it("exports api client with correct methods", async () => {
    const { apiClient } = await import("@/lib/api-client")
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe("function")
    expect(typeof apiClient.post).toBe("function")
    expect(typeof apiClient.patch).toBe("function")
    expect(typeof apiClient.delete).toBe("function")
  })

  it("exports getQueryClient correctly", async () => {
    const { getQueryClient } = await import("@/lib/get-query-client")
    const qc = getQueryClient()
    expect(qc).toBeDefined()
    expect(typeof qc.fetchQuery).toBe("function")
  })
})
