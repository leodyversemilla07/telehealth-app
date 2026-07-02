"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function PatientDetailError({
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
      title="PatientDetail Error"
      description="Failed to load patient details. Please try again."
    />
  )
}
