import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useJoinRoom } from "@/hooks/use-video"
import { ApiError } from "@/lib/api-client"

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }))

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>()
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      post: postMock,
    },
  }
})

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

describe("useJoinRoom (F-CONSULT)", () => {
  beforeEach(() => postMock.mockReset())
  afterEach(() => postMock.mockReset())

  it("posts to /video/join with the appointmentId and returns the token/url", async () => {
    postMock.mockResolvedValue({
      token: "tok",
      url: "wss://livekit.example.com",
      roomName: "appointment-1",
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useJoinRoom(), { wrapper })

    result.current.mutate({ appointmentId: "apt-1" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(postMock).toHaveBeenCalledWith("/video/join", {
      appointmentId: "apt-1",
    })
    expect(result.current.data).toEqual({
      token: "tok",
      url: "wss://livekit.example.com",
      roomName: "appointment-1",
    })
  })

  it("surfaces a 403 'Video consultation is not configured' as an error", async () => {
    postMock.mockRejectedValue(
      new ApiError("Video consultation is not configured", 403, "Forbidden"),
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useJoinRoom(), { wrapper })

    result.current.mutate({ appointmentId: "apt-1" })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).statusCode).toBe(403)
    expect(result.current.error?.message).toBe(
      "Video consultation is not configured",
    )
  })
})
