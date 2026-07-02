"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function DoctorSettingsError({
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
      title="DoctorSettings Error"
      description="Failed to load settings. Please try again."
    />
  )
}
