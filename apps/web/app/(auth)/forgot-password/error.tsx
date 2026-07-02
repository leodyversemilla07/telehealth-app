"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function ForgotPasswordError({
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
      title="ForgotPassword Error"
      description="Failed to load the forgot password page. Please try again."
    />
  )
}
