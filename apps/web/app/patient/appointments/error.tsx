"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function AppointmentsError({
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
      title="Appointments Error"
      description="Failed to load your appointments. Please try again or contact support if the issue persists."
    />
  )
}
