import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { AppointmentDto } from "@workspace/shared"
import { cookies } from "next/headers"
import { apiClient } from "@/lib/api-client"
import { getQueryClient } from "@/lib/get-query-client"
import { DoctorConsultationsClient } from "./_components/doctor-consultations-client"

export default async function DoctorConsultationsPage() {
  const queryClient = getQueryClient()
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  // Prefetch doctor's consultations list on the server forwarding credentials
  await queryClient.prefetchQuery({
    queryKey: ["appointments", "list"],
    queryFn: () =>
      apiClient.get<AppointmentDto[]>("/appointments", {
        headers: {
          cookie: cookieHeader,
        },
      }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DoctorConsultationsClient />
    </HydrationBoundary>
  )
}
