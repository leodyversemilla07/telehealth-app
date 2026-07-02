import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, apiClient } from "@/lib/api-client"

describe("API Client", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe("ApiError", () => {
    it("should create error with correct properties", () => {
      const error = new ApiError("Not found", 404, "NOT_FOUND")
      expect(error.message).toBe("Not found")
      expect(error.statusCode).toBe(404)
      expect(error.error).toBe("NOT_FOUND")
      expect(error.name).toBe("ApiError")
    })
  })

  describe("request", () => {
    it("should make GET requests", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ data: "test" }),
      })
      vi.stubGlobal("fetch", mockFetch)

      const result = await apiClient.get("/test")
      expect(mockFetch).toHaveBeenCalled()
      expect(result).toEqual({ data: "test" })
    })

    it("should make POST requests with JSON body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ id: "1" }),
      })
      vi.stubGlobal("fetch", mockFetch)

      const result = await apiClient.post("/test", { name: "test" })
      expect(mockFetch).toHaveBeenCalled()
      const [, options] = mockFetch.mock.calls[0]
      expect(options.method).toBe("POST")
      expect(options.body).toBe(JSON.stringify({ name: "test" }))
      expect(result).toEqual({ id: "1" })
    })

    it("should append query params to URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve([]),
      })
      vi.stubGlobal("fetch", mockFetch)

      await apiClient.get("/test", { params: { page: 1, limit: 10 } })
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain("page=1")
      expect(url).toContain("limit=10")
    })

    it("should throw ApiError on non-OK response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () =>
          Promise.resolve({ message: "Resource not found", statusCode: 404 }),
      })
      vi.stubGlobal("fetch", mockFetch)

      await expect(apiClient.get("/not-found")).rejects.toThrow(ApiError)
    })

    it("should handle 204 No Content", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
      })
      vi.stubGlobal("fetch", mockFetch)

      const result = await apiClient.delete("/test")
      expect(result).toEqual({})
    })

    it("should handle FormData body without Content-Type header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ uploaded: true }),
      })
      vi.stubGlobal("fetch", mockFetch)

      const formData = new FormData()
      formData.append("file", new Blob(["test"]), "test.txt")
      await apiClient.post("/upload", formData)
      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers).not.toHaveProperty("Content-Type")
    })

    it("should set credentials to include", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({}),
      })
      vi.stubGlobal("fetch", mockFetch)

      await apiClient.get("/test")
      const [, options] = mockFetch.mock.calls[0]
      expect(options.credentials).toBe("include")
    })
  })

  describe("retry logic", () => {
    it("should not retry on 400 status", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ message: "Invalid input" }),
      })
      vi.stubGlobal("fetch", mockFetch)

      await expect(apiClient.get("/test", { retries: 2 })).rejects.toThrow(
        ApiError,
      )
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("should not retry on 401 status", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({ message: "Unauthorized" }),
      })
      vi.stubGlobal("fetch", mockFetch)

      await expect(apiClient.get("/test", { retries: 2 })).rejects.toThrow(
        ApiError,
      )
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it("should not retry on 403 status", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: () => Promise.resolve({ message: "Forbidden" }),
      })
      vi.stubGlobal("fetch", mockFetch)

      await expect(apiClient.get("/test", { retries: 2 })).rejects.toThrow(
        ApiError,
      )
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
