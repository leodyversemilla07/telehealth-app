"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function AdminAppearanceError({
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
      title="AdminAppearance Error"
      description="Failed to load appearance settings. Please try again."
    />
  )
}
