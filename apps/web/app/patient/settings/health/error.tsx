"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function PatientHealthError({
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
      title="PatientHealth Error"
      description="Failed to load health settings. Please try again."
    />
  )
}
