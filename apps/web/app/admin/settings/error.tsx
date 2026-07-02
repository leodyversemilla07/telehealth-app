"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function AdminSettingsError({
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
      title="Settings Error"
      description="Failed to load settings. Please try again or contact support if the issue persists."
    />
  )
}
