"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function ScheduleError({
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
      title="Schedule Error"
      description="Failed to load the schedule manager. Please try again or contact support if the issue persists."
    />
  )
}
