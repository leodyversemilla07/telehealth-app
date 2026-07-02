"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function AdminPasswordError({
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
      title="AdminPassword Error"
      description="Failed to load password settings. Please try again."
    />
  )
}
