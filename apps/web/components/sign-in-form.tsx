"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
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
import { authClient } from "@/lib/auth-client"

type SignInState = {
  error: string | null
  twoFactorRequired: boolean
  redirectTo: string | null
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
  const [socialLoading, setSocialLoading] = useState<"apple" | "google" | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  const [state, formAction] = useActionState<SignInState, FormData>(
    async (_prev, formData) => {
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      if (!email || !password) {
        return {
          error: "Email and password are required",
          twoFactorRequired: false,
          redirectTo: null,
        }
      }

      const res = await authClient.signIn.email({ email, password })

      if (res.error) {
        return {
          error: res.error.message ?? res.error.statusText ?? "Sign in failed",
          twoFactorRequired: false,
          redirectTo: null,
        }
      }

      const data = res.data as {
        twoFactorRedirect?: boolean
        user?: { role?: string }
      } | null

      if (data?.twoFactorRedirect) {
        toast.info("Two-Factor Authentication is required for this account.")
        return { error: null, twoFactorRequired: true, redirectTo: null }
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

      return { error: null, twoFactorRequired: false, redirectTo: dashboard }
    },
    { error: null, twoFactorRequired: false, redirectTo: null },
  )

  // Form actions update state after the action settles; navigate from this
  // client effect rather than performing router side effects inside the action.
  useEffect(() => {
    if (!state.redirectTo) return
    toast.success("Successfully logged in!")
    router.replace(state.redirectTo)
  }, [router, state.redirectTo])

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

          <FieldSeparator>Or</FieldSeparator>

          <Field className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              type="button"
              className="w-full"
              disabled={isPending || socialLoading !== null}
              onClick={async () => {
                setSocialLoading("apple")
                await authClient.signIn.social({ provider: "apple" })
                setSocialLoading(null)
              }}
            >
              {socialLoading === "apple" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Apple"
                >
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
              )}
              Continue with Apple
            </Button>
            <Button
              variant="outline"
              type="button"
              className="w-full"
              disabled={isPending || socialLoading !== null}
              onClick={async () => {
                setSocialLoading("google")
                await authClient.signIn.social({ provider: "google" })
                setSocialLoading(null)
              }}
            >
              {socialLoading === "google" ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Google"
                >
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
              )}
              Continue with Google
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
