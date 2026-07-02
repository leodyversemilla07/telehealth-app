"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function DoctorPasswordError({
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
      title="DoctorPassword Error"
      description="Failed to load password settings. Please try again."
    />
  )
}
