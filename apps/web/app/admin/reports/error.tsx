"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function ReportsError({
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
      title="Reports Error"
      description="Failed to load reports. Please try again or contact support if the issue persists."
    />
  )
}
