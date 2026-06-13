"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import { CheckCircle2, Key, Lock, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

type ResetState = {
  error: string | null
  success: boolean
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full py-5 rounded-xl text-sm font-semibold"
      disabled={pending}
    >
      {pending ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          Resetting...
        </>
      ) : (
        "Reset password"
      )}
    </Button>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [state, formAction] = useActionState<ResetState, FormData>(
    async (_prev, formData) => {
      const password = formData.get("password") as string
      const confirmPassword = formData.get("confirmPassword") as string
      const resetToken = formData.get("token") as string

      if (!resetToken) {
        return {
          error: "Missing reset token. Use the link from your email.",
          success: false,
        }
      }

      if (!password || password.length < 8) {
        return {
          error: "Password must be at least 8 characters.",
          success: false,
        }
      }

      if (password !== confirmPassword) {
        return { error: "Passwords do not match.", success: false }
      }

      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: resetToken,
      })

      if (resetError) {
        return {
          error: resetError.message ?? "Failed to reset password.",
          success: false,
        }
      }

      toast.success("Password reset successfully!")
      return { error: null, success: true }
    },
    { error: null, success: false },
  )

  if (state.success) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-linear-to-br from-background via-background/95 to-muted/10">
        <div className="w-full max-w-sm space-y-6 bg-card/65 backdrop-blur-md border border-border/30 p-8 rounded-2xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">
              Password updated
            </h1>
            <p className="text-sm text-muted-foreground">
              Your password has been reset successfully.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Sign in with new password
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-linear-to-br from-background via-background/95 to-muted/10">
      <div className="w-full max-w-sm space-y-6 bg-card/65 backdrop-blur-md border border-border/30 p-8 rounded-2xl shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Set new password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your new password below.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token ?? ""} />

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="pl-9 py-5 rounded-xl border-border/60"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="pl-9 py-5 rounded-xl border-border/60"
                required
              />
            </div>
          </div>

          {state.error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <p>{state.error}</p>
            </div>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
