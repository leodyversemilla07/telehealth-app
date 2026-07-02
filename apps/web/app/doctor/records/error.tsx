"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function DoctorRecordsError({
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
      title="Records Error"
      description="Failed to load consultation records. Please try again or contact support if the issue persists."
    />
  )
}
