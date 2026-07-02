"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function PrescriptionsError({
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
      title="Prescriptions Error"
      description="Failed to load your prescriptions. Please try again or contact support if the issue persists."
    />
  )
}
