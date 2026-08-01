"use client"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { Eye, EyeOff } from "lucide-react"
import * as React from "react"

/**
 * Password field with a show/hide toggle (eye icon) for better UX.
 * Keeps `h-8` input sizing consistent with the rest of the form, adds
 * right padding so the toggle never overlaps the typed value, and mirrors
 * the input's disabled state onto the toggle button.
 */
function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={props.disabled}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Eye className="size-4 shrink-0" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

export { PasswordInput }
