"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function AdminSessionsError({
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
      title="AdminSessions Error"
      description="Failed to load session settings. Please try again."
    />
  )
}
