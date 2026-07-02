"use client"

import { ErrorBoundary } from "@/components/error-boundary"

export default function AppointmentDetailError({
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
      title="Appointment Error"
      description="Failed to load the appointment details. Please try again or contact support if the issue persists."
    />
  )
}
