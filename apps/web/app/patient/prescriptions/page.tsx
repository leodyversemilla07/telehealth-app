import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { PrescriptionDto } from "@workspace/shared"
import { cookies } from "next/headers"
import { apiClient } from "@/lib/api-client"
import { getQueryClient } from "@/lib/get-query-client"
import { PatientPrescriptionsClient } from "./_components/patient-prescriptions-client"

export default async function PatientPrescriptionsPage() {
  const queryClient = getQueryClient()
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  // Prefetch patient prescriptions on the server forwarding browser credentials
  await queryClient.prefetchQuery({
    queryKey: ["records", "prescriptions"],
    queryFn: () =>
      apiClient.get<PrescriptionDto[]>("/records/prescriptions", {
        headers: {
          cookie: cookieHeader,
        },
      }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PatientPrescriptionsClient />
    </HydrationBoundary>
  )
}
