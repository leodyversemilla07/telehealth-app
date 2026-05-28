import type { ApiErrorResponse } from "@workspace/shared/types/api"
import { env } from "@/lib/env"

/**
 * Custom typed error class representing an API failure.
 */
export class ApiError extends Error {
  statusCode: number
  error?: string

  constructor(message: string, statusCode: number, error?: string) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
    this.error = error
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
  const isAbsolute = /^https?:\/\//i.test(rawBaseUrl)
  return isAbsolute
    ? rawBaseUrl
    : rawBaseUrl.endsWith("/api")
      ? rawBaseUrl
      : `${rawBaseUrl}/api`
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * Generic request helper wrapping the native fetch API.
 */
async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { params, headers, ...rest } = options

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

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    // Crucial for sending better-auth session cookies back and forth
    credentials: "include",
  })

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

    throw new ApiError(message, statusCode, error)
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return {} as TResponse
  }

  try {
    return await response.json()
  } catch {
    return {} as TResponse
  }
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
