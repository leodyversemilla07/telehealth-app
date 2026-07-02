"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function UsersError({
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
      title="Users Management Error"
      description="Failed to load user management. Please try again or contact support if the issue persists."
    />
  )
}
