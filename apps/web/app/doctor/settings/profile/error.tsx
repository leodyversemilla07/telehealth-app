"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function DoctorProfileError({
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
      title="DoctorProfile Error"
      description="Failed to load profile settings. Please try again."
    />
  )
}
