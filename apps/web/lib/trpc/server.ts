import "server-only"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import {
  createTRPCOptionsProxy,
  type TRPCOptionsProxy,
} from "@trpc/tanstack-react-query"
import type { AppRouter } from "api/app-router"
import { cookies } from "next/headers"
import { cache } from "react"
import { getQueryClient } from "@/lib/get-query-client"

/**
 * tRPC caller for React Server Components and server-side data fetching.
 * Calls the API directly (API_URL) and forwards the session cookie, mirroring
 * the reference crm repo.
 */

const API_BASE_URL = (process.env.API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
)

export const getServerQueryClient = cache(getQueryClient)

export function getServerTrpc(): TRPCOptionsProxy<AppRouter> {
  const client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${API_BASE_URL}/api/trpc`,
        headers: async () => {
          const cookie = (await cookies()).toString()
          return cookie ? { cookie } : {}
        },
      }),
    ],
  })

  return createTRPCOptionsProxy<AppRouter>({
    client,
    queryClient: getServerQueryClient,
  })
}
