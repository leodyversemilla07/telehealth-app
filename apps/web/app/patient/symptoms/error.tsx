"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function SymptomsError({
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
      title="Symptom Checker Error"
      description="Failed to load the symptom checker. Please try again or contact support if the issue persists."
    />
  )
}
