"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function ConsultationDetailError({
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
      title="Consultation Error"
      description="Failed to load the consultation session. Please try again or contact support if the issue persists."
    />
  )
}
