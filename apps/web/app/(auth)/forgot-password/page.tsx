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
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { AuthLayout } from "@/components/auth-layout"
import { env } from "@/lib/env"

type ForgotState = {
  error: string | null
  success: boolean
  email: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Sending link...
        </>
      ) : (
        "Send recovery link"
      )}
    </Button>
  )
}

function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ForgotState, FormData>(
    async (_prev, formData) => {
      const email = formData.get("email") as string

      if (!email) {
        return { error: "Email is required", success: false, email: "" }
      }

      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/auth/forget-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}/reset-password`,
          }),
        },
      )

      if (!res.ok) {
        return {
          error: "Failed to send reset link. Please try again later.",
          success: false,
          email: "",
        }
      }

      toast.add({
        title:
          "If this email exists, you'll receive a password reset link shortly.",
        type: "success",
      })
      return { error: null, success: true, email }
    },
    { error: null, success: false, email: "" },
  )

  if (state.success) {
    return (
      <AuthLayout variant="center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Check your email</h1>
            <FieldDescription className="text-balance">
              We&apos;ve sent a password reset link to{" "}
              <strong className="text-foreground">{state.email}</strong>. It
              will expire in 1 hour.
            </FieldDescription>
          </div>
          <Button
            variant="outline"
            className="w-full"
            nativeButton={false}
            render={<Link href="/sign-in" />}
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="center">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-bold">Forgot password?</h1>
          <FieldDescription className="text-balance">
            Enter the email address linked to your account and we&apos;ll send
            you a recovery link.
          </FieldDescription>
        </div>

        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
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

        <FieldDescription className="text-center">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="underline underline-offset-4 font-semibold"
          >
            Sign In
          </Link>
        </FieldDescription>
      </div>
    </AuthLayout>
  )
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
