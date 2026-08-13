"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"
import { CheckCircle2, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { AuthLayout } from "@/components/auth-layout"
import { authClient } from "@/lib/auth-client"

type ResetState = {
  error: string | null
  success: boolean
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
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

      toast.add({ title: "Password reset successfully!", type: "success" })
      return { error: null, success: true }
    },
    { error: null, success: false },
  )

  if (state.success) {
    return (
      <AuthLayout variant="center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Password updated</h1>
            <FieldDescription className="text-balance">
              Your password has been reset successfully.
            </FieldDescription>
          </div>
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link href="/sign-in" />}
          >
            Sign in with new password
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="center">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-bold">Set new password</h1>
          <FieldDescription className="text-balance">
            Enter your new password below.
          </FieldDescription>
        </div>

        <form action={formAction}>
          <FieldGroup>
            <input type="hidden" name="token" value={token ?? ""} />

            <Field>
              <FieldLabel htmlFor="password">New Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </Field>

            {state.error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <p>{state.error}</p>
              </div>
            )}

            <SubmitButton />
          </FieldGroup>
        </form>
      </div>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
