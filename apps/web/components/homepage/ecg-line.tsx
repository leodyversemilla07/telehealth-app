"use client"

import { cn } from "@workspace/ui/lib/utils"

/**
 * The signature animated ECG heartbeat line.
 * A self-drawing cardiogram stroke used across the homepage as a motif
 * (hero, section dividers, CTA panel).
 */
export function EcgLine({
  className,
  strokeClassName,
}: {
  className?: string
  strokeClassName?: string
}) {
  return (
    <svg
      viewBox="0 0 600 64"
      fill="none"
      aria-hidden="true"
      className={cn("block h-10 w-full", className)}
      preserveAspectRatio="none"
    >
      <path
        d="M0 32 H120 L132 32 L138 22 L144 40 L150 32 H180 L190 32 L198 14 L206 46 L214 32 L232 32 L236 32 L240 28 L244 34 L248 32 L262 32 H300 L312 32 L318 22 L324 40 L330 32 H360 L370 32 L378 14 L386 46 L394 32 H420 L430 32 L436 22 L442 40 L448 32 H480 L492 32 L498 24 L504 40 L510 32 L524 32 L528 32 L532 28 L536 34 L540 32 H600"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "ecg-path stroke-primary/80 dark:stroke-primary",
          strokeClassName,
        )}
      />
      {/* soft glow under the trace */}
      <path
        d="M0 32 H120 L132 32 L138 22 L144 40 L150 32 H180 L190 32 L198 14 L206 46 L214 32 L232 32 L236 32 L240 28 L244 34 L248 32 L262 32 H300 L312 32 L318 22 L324 40 L330 32 H360 L370 32 L378 14 L386 46 L394 32 H420 L430 32 L436 22 L442 40 L448 32 H480 L492 32 L498 24 L504 40 L510 32 L524 32 L528 32 L532 28 L536 34 L540 32 H600"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        className="opacity-[0.06]"
      />
    </svg>
  )
}
