import type { ApiErrorResponse } from "@workspace/shared/types/api"
import { env } from "@/lib/env"

/**
 * Custom typed error class representing an API failure.
 */
export class ApiError extends Error {
  statusCode: number
  error?: string
  code?: string
  details?: unknown

  constructor(
    message: string,
    statusCode: number,
    error?: string,
    code?: string,
    details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.error = error
    this.code = code
    this.details = details
  }
}

const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    const serverUrl = process.env.API_URL || "http://localhost:3001"
    const cleaned = serverUrl.replace(/\/$/, "")
    return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`
  }

  const rawBaseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  if (!rawBaseUrl) {
    return "/api"
  }

  return rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl}/api`
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  /** Timeout in ms (default: 30s). Set to 0 to disable. */
  timeout?: number
  /** Number of retries for transient failures (default: 2). Set to 0 to disable. */
  retries?: number
}

/** HTTP status codes eligible for automatic retry */
const RETRYABLE_STATUS_CODES = new Set([408, 429, 502, 503, 504])

/** Check if a response is eligible for retry */
function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (RETRYABLE_STATUS_CODES.has(error.statusCode)) return true
    // Network errors (TypeError from fetch) are also retryable
  }
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true
  }
  return false
}

/** Sleep helper with jitter for exponential backoff */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generic request helper wrapping the native fetch API.
 * Includes timeout support and automatic retries for transient failures.
 */
async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { params, headers, timeout = 30_000, retries = 2, ...rest } = options

  // Append query string if params are provided
  let url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    }
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  // Setup default JSON headers unless sending FormData
  const defaultHeaders: Record<string, string> = {}
  if (!(rest.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json"
  }

  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Create an AbortController for timeout (only if not already aborted)
    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (timeout > 0) {
      timeoutId = setTimeout(() => controller.abort(), timeout)
    }

    try {
      // If the original signal was already aborted, skip fetch
      if (rest.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError")
      }

      const response = await fetch(url, {
        ...rest,
        signal: controller.signal,
        headers: {
          ...defaultHeaders,
          ...headers,
        },
        // Crucial for sending better-auth session cookies back and forth
        credentials: "include",
      })

      // Clear timeout since we got a response
      if (timeoutId) clearTimeout(timeoutId)

      // Handle non-OK status responses
      if (!response.ok) {
        let errorData: ApiErrorResponse | null = null
        try {
          errorData = await response.json()
        } catch {
          // Not a JSON response
        }

        const rawMessage = errorData?.message || response.statusText
        const message = Array.isArray(rawMessage)
          ? rawMessage.join(", ")
          : rawMessage
        const statusCode = errorData?.statusCode || response.status
        const error = errorData?.error

        const apiError = new ApiError(
          message,
          statusCode,
          error,
          errorData?.code,
          errorData?.details,
        )

        // Retry if eligible and not last attempt
        if (isRetryable(apiError) && attempt < retries) {
          const delay = Math.min(1000 * 2 ** attempt, 10_000) // exponential backoff, max 10s
          const jitter = Math.random() * 500 // add jitter to prevent thundering herd
          await sleep(delay + jitter)
          continue
        }

        throw apiError
      }

      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return {} as TResponse
      }

      try {
        return await response.json()
      } catch {
        // Response was 200 but body wasn't valid JSON (e.g. proxy error page)
        if (response.headers.get("content-length") !== "0") {
          throw new ApiError("Invalid JSON response from API", response.status)
        }
        return {} as TResponse
      }
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId)

      // Don't retry user-initiated aborts (e.g., component unmount)
      if (error instanceof DOMException && error.name === "AbortError") {
        // Check if it was the user's signal or our timeout
        if (rest.signal?.aborted) {
          throw error
        }
        // Timeout abort — retry if eligible
        if (attempt < retries) {
          const delay = Math.min(1000 * 2 ** attempt, 10_000)
          await sleep(delay)
          continue
        }
        throw new ApiError(
          `Request timed out after ${timeout}ms`,
          408,
          "TIMEOUT",
        )
      }

      lastError = error

      // Retry on transient failures
      if (isRetryable(error) && attempt < retries) {
        const delay = Math.min(1000 * 2 ** attempt, 10_000)
        const jitter = Math.random() * 500
        await sleep(delay + jitter)
        continue
      }

      throw error
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError instanceof Error
    ? lastError
    : new ApiError("Request failed", 500, "UNKNOWN_ERROR")
}

/**
 * Premium API client offering HTTP verb methods.
 */
export const apiClient = {
  get<TResponse>(path: string, options?: RequestOptions) {
    return request<TResponse>(path, { ...options, method: "GET" })
  },

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) {
    return request<TResponse>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) {
    return request<TResponse>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) {
    return request<TResponse>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    })
  },

  delete<TResponse>(path: string, options?: RequestOptions) {
    return request<TResponse>(path, { ...options, method: "DELETE" })
  },
}
