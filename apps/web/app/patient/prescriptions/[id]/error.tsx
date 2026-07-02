"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function PrescriptionDetailError({
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
      title="PrescriptionDetail Error"
      description="Failed to load prescription details. Please try again."
    />
  )
}
