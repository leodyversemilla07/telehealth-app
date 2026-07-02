"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function AdminAlertsError({
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
      title="AdminAlerts Error"
      description="Failed to load alert settings. Please try again."
    />
  )
}
