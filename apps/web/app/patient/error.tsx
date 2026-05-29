"use client"

import { Button } from "@workspace/ui/components/button"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { useEffect } from "react"

export default function PatientError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Patient error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred in Patient Portal.
            {error.digest && (
              <span className="block mt-1 text-xs font-mono text-muted-foreground/60">
                Error ID: {error.digest}
              </span>
            )}
          </p>
        </div>
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
