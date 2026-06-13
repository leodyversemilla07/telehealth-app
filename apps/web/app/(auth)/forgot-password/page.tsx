"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import { ArrowLeft, CheckCircle2, Mail, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { env } from "@/lib/env"

type ForgotState = {
  error: string | null
  success: boolean
  email: string
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
          Sending link...
        </>
      ) : (
        "Send recovery link"
      )}
    </Button>
  )
}

export default function ForgotPasswordPage() {
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

      toast.success(
        "If this email exists, you'll receive a password reset link shortly.",
      )
      return { error: null, success: true, email }
    },
    { error: null, success: false, email: "" },
  )

  if (state.success) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-gradient-to-br from-background via-background/95 to-muted/10">
        <div className="w-full max-w-sm space-y-6 bg-card/65 backdrop-blur-md border border-border/30 p-8 rounded-2xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;ve sent a password reset link to{" "}
              <strong className="text-foreground">{state.email}</strong>. It
              will expire in 1 hour.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-4 font-semibold hover:text-primary/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-gradient-to-br from-background via-background/95 to-muted/10">
      <div className="w-full max-w-sm space-y-6 bg-card/65 backdrop-blur-md border border-border/30 p-8 rounded-2xl shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Forgot password?
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter the email address linked to your account and we&apos;ll send
            you a recovery link.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
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

        <p className="text-muted-foreground text-center text-xs pt-2">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="text-primary underline underline-offset-4 font-semibold hover:text-primary/80"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
