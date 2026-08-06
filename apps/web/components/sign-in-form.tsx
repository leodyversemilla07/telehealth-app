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
import { GalleryVerticalEndIcon, Key, Shield, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { PasswordInput } from "@/components/password-input"
import { authClient } from "@/lib/auth-client"

type SignInState = {
  error: string | null
  twoFactorRequired: boolean
  redirectTo: string | null
  /** Set when sign-in fails because the email isn't verified yet. */
  verificationEmail: string | null
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
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
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")
  const formRef = useRef<HTMLFormElement>(null)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [isPending, startTransition] = useTransition()
  const [verifyResent, setVerifyResent] = useState(false)

  const [state, formAction] = useActionState<SignInState, FormData>(
    async (_prev, formData) => {
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      if (!email || !password) {
        return {
          error: "Email and password are required",
          twoFactorRequired: false,
          redirectTo: null,
          verificationEmail: null,
        }
      }

      const res = await authClient.signIn.email({ email, password })

      if (res.error) {
        const message =
          res.error.message ?? res.error.statusText ?? "Sign in failed"
        const needsVerification = /email not verified/i.test(message)
        return {
          error: message,
          twoFactorRequired: false,
          redirectTo: null,
          verificationEmail: needsVerification ? email : null,
        }
      }

      const data = res.data as {
        twoFactorRedirect?: boolean
        user?: { role?: string }
      } | null

      if (data?.twoFactorRedirect) {
        toast.info("Two-Factor Authentication is required for this account.")
        return {
          error: null,
          twoFactorRequired: true,
          redirectTo: null,
          verificationEmail: null,
        }
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

      return {
        error: null,
        twoFactorRequired: false,
        redirectTo: dashboard,
        verificationEmail: null,
      }
    },
    {
      error: null,
      twoFactorRequired: false,
      redirectTo: null,
      verificationEmail: null,
    },
  )

  // Form actions update state after the action settles; navigate from this
  // client effect rather than performing router side effects inside the action.
  useEffect(() => {
    if (!state.redirectTo) return
    // The redirect itself is the login-success signal; no toast needed.
    router.replace(state.redirectTo)
  }, [router, state.redirectTo])

  // Reflect the action's 2FA claim in the UI. With useActionState the
  // "twoFactorRequired" flag lands in `state` but was never applied to the
  // rendered view, so the TOTP step never appeared and 2FA-enforced
  // doctor/admin accounts could not complete sign-in.
  useEffect(() => {
    if (state.twoFactorRequired) setShowTwoFactor(true)
  }, [state.twoFactorRequired])

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

        // Successful 2FA — the redirect to the dashboard signals success.
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

  async function handleResendVerification() {
    const email = state.verificationEmail
    if (!email) return
    startTransition(async () => {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/sign-in`,
      })
      if (error) {
        toast.error(error.message ?? "Could not resend the verification email.")
        return
      }
      setVerifyResent(true)
      toast.success("Verification email sent. Please check your inbox.")
    })
  }

  if (showTwoFactor) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEndIcon className="size-6" />
          </div>
          <span className="sr-only">Telehealth</span>
          <h1 className="text-xl font-bold">Two-Factor Authentication</h1>
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
            <Shield className="size-6 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">
            Enter your 6-digit authenticator code or a backup recovery code.
          </p>
        </div>

        <form onSubmit={handleTwoFactorSubmit} className="flex flex-col gap-6">
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
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </Field>

            <Field>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                disabled={isPending}
                onClick={() => {
                  setShowTwoFactor(false)
                  setTwoFactorCode("")
                }}
              >
                Back to sign in
              </Button>
            </Field>
          </FieldGroup>
        </form>

        <FieldDescription className="px-6 text-center">
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </FieldDescription>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form ref={formRef} action={formAction}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEndIcon className="size-6" />
              </div>
              <span className="sr-only">Telehealth</span>
            </Link>
            <h1 className="text-xl font-bold">Welcome to Telehealth</h1>
            <FieldDescription>
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </FieldDescription>
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
            <PasswordInput
              id="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>

          {state.error && (
            <div
              role="alert"
              className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl"
            >
              <ShieldAlert className="size-4 shrink-0" />
              <div className="flex flex-col gap-1">
                <p>{state.error}</p>
                {state.verificationEmail && !verifyResent && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isPending}
                    className="text-left text-xs underline underline-offset-4 disabled:opacity-50 hover:text-destructive/80 transition-colors"
                  >
                    Resend verification email
                  </button>
                )}
                {verifyResent && (
                  <p className="text-xs text-muted-foreground">
                    Verification email sent — check your inbox.
                  </p>
                )}
              </div>
            </div>
          )}

          <Field>
            <SubmitButton>Sign In</SubmitButton>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  )
}
