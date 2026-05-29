import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { ConsultationWithPrescriptionsDto } from "@workspace/shared"
import { cookies } from "next/headers"
import { apiClient } from "@/lib/api-client"
import { getQueryClient } from "@/lib/get-query-client"
import { PatientRecordsClient } from "./_components/patient-records-client"

export default async function PatientRecordsPage() {
  const queryClient = getQueryClient()
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  await queryClient.prefetchQuery({
    queryKey: ["records", "list"],
    queryFn: () =>
      apiClient.get<ConsultationWithPrescriptionsDto[]>(
        "/records/consultations",
        {
          headers: { cookie: cookieHeader },
        },
      ),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PatientRecordsClient />
    </HydrationBoundary>
  )
}
