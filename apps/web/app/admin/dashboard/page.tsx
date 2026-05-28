import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { AuditLogDto } from "@workspace/shared"
import { cookies } from "next/headers"
import { apiClient } from "@/lib/api-client"
import { getQueryClient } from "@/lib/get-query-client"
import type { DashboardStats } from "./_components/admin-dashboard-client"
import { AdminDashboardClient } from "./_components/admin-dashboard-client"

export default async function AdminDashboardPage() {
  const queryClient = getQueryClient()
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  // 1. Prefetch stats on the server, forwarding browser credentials for authorization
  await queryClient.prefetchQuery({
    queryKey: ["admin-stats"],
    queryFn: () =>
      apiClient.get<DashboardStats>("/admin/dashboard", {
        headers: {
          cookie: cookieHeader,
        },
      }),
  })

  // 2. Prefetch security audit logs on the server, forwarding browser credentials for authorization
  await queryClient.prefetchQuery({
    queryKey: ["audit-logs"],
    queryFn: () =>
      apiClient.get<AuditLogDto[]>("/audit-logs", {
        headers: {
          cookie: cookieHeader,
        },
      }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminDashboardClient />
    </HydrationBoundary>
  )
}
