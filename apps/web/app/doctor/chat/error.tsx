"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function DoctorChatError({
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
      title="Chat Error"
      description="Failed to load the messaging system. Please try again or contact support if the issue persists."
    />
  )
}
