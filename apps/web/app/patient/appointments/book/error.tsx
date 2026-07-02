"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function BookAppointmentError({
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
      title="Booking Error"
      description="Failed to load the appointment booking page. Please try again or contact support if the issue persists."
    />
  )
}
