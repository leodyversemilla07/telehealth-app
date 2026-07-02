"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function PatientsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <ErrorBoundary
      error={error}
      reset={unstable_retry}
      title="Patients Error"
      description="Failed to load the patient list. Please try again or contact support if the issue persists."
    />
  )
}
