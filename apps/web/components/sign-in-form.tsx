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
import { cn } from "@workspace/ui/lib/utils"
import { ArrowLeft, Key, Shield, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useActionState, useRef, useState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

type SignInState = {
  error: string | null
  twoFactorRequired: boolean
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner className="mr-2 size-4" />
          {children === "Sign In" ? "Signing in..." : "Verifying Code..."}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")
  const formRef = useRef<HTMLFormElement>(null)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [isPending, startTransition] = useTransition()

  const [state, formAction] = useActionState<SignInState, FormData>(
    async (_prev, formData) => {
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      if (!email || !password) {
        return {
          error: "Email and password are required",
          twoFactorRequired: false,
        }
      }

      const res = await authClient.signIn.email({ email, password })

      if (res.error) {
        return {
          error: res.error.message ?? res.error.statusText ?? "Sign in failed",
          twoFactorRequired: false,
        }
      }

      const data = res.data as {
        twoFactorRedirect?: boolean
        user?: { role?: string }
      } | null

      if (data?.twoFactorRedirect) {
        toast.info("Two-Factor Authentication is required for this account.")
        return { error: null, twoFactorRequired: true }
      }

      const role = data?.user?.role ?? "PATIENT"
      const safeCallbackUrl =
        callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : undefined
      const dashboard =
        safeCallbackUrl ??
        (role === "ADMIN"
          ? "/admin/dashboard"
          : role === "DOCTOR"
            ? "/doctor/dashboard"
            : "/patient/dashboard")

      toast.success("Successfully logged in!")
      router.push(dashboard)
      return { error: null, twoFactorRequired: false }
    },
    { error: null, twoFactorRequired: false },
  )

  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!twoFactorCode.trim()) return

    startTransition(async () => {
      try {
        const isTotp = /^\d{6}$/.test(twoFactorCode.trim())

        if (isTotp) {
          const { error: totpError } = await authClient.twoFactor.verifyTotp({
            code: twoFactorCode.trim(),
          })
          if (totpError) {
            toast.error(totpError.message ?? "Invalid verification code.")
            return
          }
        } else {
          const { error: backupError } =
            await authClient.twoFactor.verifyBackupCode({
              code: twoFactorCode.trim(),
            })
          if (backupError) {
            toast.error(backupError.message ?? "Invalid recovery backup code.")
            return
          }
        }

        toast.success("Multi-Factor authentication successful!")
        const sessionRes = await authClient.getSession()
        const role =
          (sessionRes.data?.user as { role?: string } | undefined)?.role ??
          "PATIENT"
        const safeCallbackUrl2FA =
          callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
            ? callbackUrl
            : undefined
        const dashboard2FA =
          safeCallbackUrl2FA ??
          (role === "ADMIN"
            ? "/admin/dashboard"
            : role === "DOCTOR"
              ? "/doctor/dashboard"
              : "/patient/dashboard")
        router.push(dashboard2FA)
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during verification.",
        )
      }
    })
  }

  if (showTwoFactor) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-2">
              <Shield className="size-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Verify Identity
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your 6-digit authenticator code or a backup recovery code.
            </p>
          </div>

          <form
            onSubmit={handleTwoFactorSubmit}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="twoFactorCode">
                  Security Verification Code
                </FieldLabel>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="twoFactorCode"
                    type="text"
                    placeholder="000000 or backup-code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    disabled={isPending}
                    className="pl-10 font-mono tracking-wider"
                    required
                    autoFocus
                  />
                </div>
              </Field>

              <Field>
                <SubmitButton>Verify Code</SubmitButton>
              </Field>
            </FieldGroup>

            <Button
              type="button"
              variant="link"
              size="sm"
              className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setShowTwoFactor(false)
                setTwoFactorCode("")
              }}
            >
              <ArrowLeft className="size-3" />
              Back to standard sign in
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      className={cn("flex flex-col gap-6", className)}
      action={formAction}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to sign in to your account
          </p>
        </div>

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

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </Field>

        {state.error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
            <ShieldAlert className="size-4 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        <Field>
          <SubmitButton>Sign In</SubmitButton>
        </Field>

        <Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
