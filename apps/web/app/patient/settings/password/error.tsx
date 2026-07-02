"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function PatientPasswordError({
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
      title="PatientPassword Error"
      description="Failed to load password settings. Please try again."
    />
  )
}
