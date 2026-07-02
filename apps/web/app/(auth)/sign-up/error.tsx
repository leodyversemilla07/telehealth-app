"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function SignUpError({
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
      title="Sign Up Error"
      description="Failed to load the sign up page. Please try again or contact support if the issue persists."
    />
  )
}
