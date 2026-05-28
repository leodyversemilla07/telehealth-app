import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { AppointmentDto } from "@workspace/shared"
import { cookies } from "next/headers"
import { apiClient } from "@/lib/api-client"
import { getQueryClient } from "@/lib/get-query-client"
import { PatientAppointmentsClient } from "./_components/patient-appointments-client"

export default async function PatientAppointmentsPage() {
  const queryClient = getQueryClient()
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  // Prefetch the appointments list on the server forwarding the session cookie
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
      <PatientAppointmentsClient />
    </HydrationBoundary>
  )
}
