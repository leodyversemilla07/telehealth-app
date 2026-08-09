import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock("@/lib/api-client", () => ({
  apiClient: { get: m.get, post: m.post },
}))

import {
  CONSENT_TYPES,
  useConsentLogs,
  useConsentStatus,
  useRecordConsent,
} from "@/hooks/use-consent"

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  m.get.mockReset()
  m.post.mockReset()
})

describe("CONSENT_TYPES", () => {
  it("has 4 consent types with unique ids and labels", () => {
    expect(CONSENT_TYPES).toHaveLength(4)
    const ids = CONSENT_TYPES.map((t) => t.id)
    const labels = CONSENT_TYPES.map((t) => t.label)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(labels).size).toBe(labels.length)
    for (const type of CONSENT_TYPES) {
      expect(typeof type.id).toBe("string")
      expect(type.id.length).toBeGreaterThan(0)
      expect(type.description.length).toBeGreaterThan(0)
    }
  })

  it("defines the four expected consent categories", () => {
    expect(CONSENT_TYPES.map((t) => t.id)).toEqual([
      "privacy_policy",
      "data_sharing",
      "recording",
      "marketing",
    ])
  })
})

describe("useConsentLogs", () => {
  it("fetches consent logs from the API", async () => {
    m.get.mockResolvedValue([{ id: "log1" }])
    const { result } = renderHook(() => useConsentLogs(), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual([{ id: "log1" }]))
    expect(m.get).toHaveBeenCalledWith("/consent")
  })
})

describe("useConsentStatus", () => {
  it("defaults every consent type to false with no logs", async () => {
    m.get.mockResolvedValue([])
    const { result } = renderHook(() => useConsentStatus(), { wrapper })
    await waitFor(() =>
      expect(Object.keys(result.current).length).toBeGreaterThan(0),
    )
    expect(result.current.privacy_policy).toBe(false)
    expect(result.current.data_sharing).toBe(false)
    expect(result.current.recording).toBe(false)
    expect(result.current.marketing).toBe(false)
  })

  it("takes the latest log per consent type by createdAt", async () => {
    m.get.mockResolvedValue([
      {
        id: "l-old",
        userId: "u1",
        consentType: "data_sharing",
        granted: true,
        ipAddress: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "l-new",
        userId: "u1",
        consentType: "data_sharing",
        granted: false,
        ipAddress: "1.2.3.4",
        createdAt: "2026-06-01T00:00:00.000Z",
      },
      {
        id: "l-rec",
        userId: "u1",
        consentType: "recording",
        granted: true,
        ipAddress: null,
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ])
    const { result } = renderHook(() => useConsentStatus(), { wrapper })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    // newest log (June, granted=false) wins over the January grant
    expect(result.current.data_sharing).toBe(false)
    expect(result.current.recording).toBe(true)
    expect(result.current.privacy_policy).toBe(false)
    expect(result.current.privacy_policy).toBe(false)
  })
})

describe("useRecordConsent", () => {
  it("posts the record and invalidates the live log query", async () => {
    m.get.mockResolvedValue([])
    m.post.mockResolvedValue({
      id: "l1",
      userId: "u1",
      consentType: "privacy_policy",
      granted: true,
      ipAddress: null,
      createdAt: "2026-06-01T00:00:00.000Z",
    })
    // Keep a consent-log query mounted so invalidation has a live observer.
    const { result } = renderHook(
      () => ({ status: useConsentStatus(), record: useRecordConsent() }),
      { wrapper },
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(m.get).toHaveBeenCalledTimes(1)
    act(() => {
      result.current.record.mutate({
        consentType: "privacy_policy",
        granted: true,
      })
    })
    await waitFor(() => expect(m.post).toHaveBeenCalledTimes(1))
    expect(m.post).toHaveBeenCalledWith("/consent", {
      consentType: "privacy_policy",
      granted: true,
    })
    // onSuccess invalidates → the mounted log query refetches
    await waitFor(() =>
      expect(m.get.mock.calls.length).toBeGreaterThanOrEqual(2),
    )
  })
})
