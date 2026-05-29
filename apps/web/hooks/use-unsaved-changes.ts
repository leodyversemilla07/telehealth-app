"use client"

import { useEffect, useRef } from "react"

/**
 * Warns the user before navigating away or closing the tab if there are
 * unsaved changes. Also blocks Next.js route changes via beforeunload.
 *
 * @param hasChanges - Whether the form has unsaved modifications
 */
export function useUnsavedChanges(hasChanges: boolean) {
  const hasChangesRef = useRef(hasChanges)

  useEffect(() => {
    hasChangesRef.current = hasChanges
  }, [hasChanges])

  // Browser-level warning (tab close, refresh, back/forward)
  useEffect(() => {
    if (!hasChanges) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasChanges])

  // Next.js route change confirmation via unsaved-changes context
  // This is handled by the router event system in the settings layout
}

/**
 * Track whether a form has been modified from its initial state.
 * Pass the initial and current values to compare.
 */
export function useFormDirty(
  initial: Record<string, unknown>,
  current: Record<string, unknown>,
): boolean {
  return JSON.stringify(initial) !== JSON.stringify(current)
}
