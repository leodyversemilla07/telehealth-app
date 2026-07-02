"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function ResetPasswordError({
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
      title="ResetPassword Error"
      description="Failed to load the reset password page. Please try again."
    />
  )
}
