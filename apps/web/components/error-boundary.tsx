"use client"

import { Button } from "@workspace/ui/components/button"
import { AlertTriangle, Copy, RefreshCcw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createLogger } from "@/lib/logger"

const log = createLogger("ErrorBoundary")

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
}

/**
 * Reusable error boundary component for catching and displaying runtime errors.
 * Used by Next.js error.tsx files to gracefully handle page-level errors.
 */
export function ErrorBoundary({
  error,
  reset,
  title = "Something went wrong",
  description,
}: ErrorBoundaryProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    log.error("Page error:", error)
  }, [error])

  const copyErrorId = useCallback(async () => {
    if (error.digest) {
      await navigator.clipboard.writeText(error.digest)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    }
  }, [error.digest])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description ||
              "An unexpected error occurred. If this persists, please contact support with the error ID below."}
          </p>
        </div>
        {error.digest && (
          <button
            type="button"
            onClick={copyErrorId}
            aria-label="Copy error ID"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <span className="truncate max-w-[200px]">{error.digest}</span>
            <Copy className="h-3 w-3 shrink-0" />
          </button>
        )}
        {copied && <p className="text-xs text-success">Copied to clipboard</p>}
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
