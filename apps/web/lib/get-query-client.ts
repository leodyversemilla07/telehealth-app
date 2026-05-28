import { isServer, QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api-client"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // Data is fresh for 1 minute
        gcTime: 10 * 60 * 1000, // Garbage collect unused data after 10 minutes

        // Exclude client-side 4xx errors from triggering redundant retries
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.statusCode < 500) {
            return false // Skip retrying on 4xx BadRequest, Unauthorized, etc.
          }
          return failureCount < 2 // Max 2 retries for transient server errors (5xx)
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
