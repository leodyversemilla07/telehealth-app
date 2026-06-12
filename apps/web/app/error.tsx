"use client"

import { Button } from "@workspace/ui/components/button"
import { AlertTriangle, Copy, RefreshCcw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires this name for error boundaries
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    console.error("Unhandled error:", error)
  }, [error])

  const copyErrorId = useCallback(async () => {
    if (error.digest) {
      await navigator.clipboard.writeText(error.digest)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [error.digest])

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred. If this persists, please contact
            support with the error ID below.
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
        <Button onClick={unstable_retry} variant="default" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}
