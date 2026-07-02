"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function PatientTwoFactorError({
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
      title="PatientTwoFactor Error"
      description="Failed to load two-factor settings. Please try again."
    />
  )
}
