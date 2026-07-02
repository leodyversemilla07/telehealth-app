"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function PatientPrivacyError({
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
      title="PatientPrivacy Error"
      description="Failed to load privacy settings. Please try again."
    />
  )
}
