"use client"

import type { SignInDto } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowLeft,
  Key,
  Loader2,
  Shield,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const _router = useRouter()
  const [form, setForm] = useState<SignInDto>({ email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null)

  const [showOAuthModal, setShowOAuthModal] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<"google" | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await authClient.signIn.email(form)

    if (res.error) {
      setError(res.error.message ?? res.error.statusText)
      setLoading(false)
      return
    }

    const data = res.data as {
      twoFactorRedirect?: boolean
      user?: { role?: string }
    } | null
    if (data?.twoFactorRedirect) {
      toast.info("Two-Factor Authentication is required for this account.")
      setShowTwoFactor(true)
      setLoading(false)
      return
    }

    const role = data?.user?.role ?? "PATIENT"
    const dashboard =
      role === "ADMIN"
        ? "/admin/dashboard"
        : role === "DOCTOR"
          ? "/doctor/dashboard"
          : "/patient/dashboard"

    toast.success("Successfully logged in!")
    window.location.href = dashboard
  }

  async function handleTwoFactorSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!twoFactorCode.trim()) return

    setTwoFactorLoading(true)
    setTwoFactorError(null)

    const isTotp = /^\d{6}$/.test(twoFactorCode.trim())

    try {
      if (isTotp) {
        const { error: totpError } = await authClient.twoFactor.verifyTotp({
          code: twoFactorCode.trim(),
        })
        if (totpError) {
          setTwoFactorError(totpError.message ?? "Invalid verification code.")
          setTwoFactorLoading(false)
          return
        }
      } else {
        const { error: backupError } =
          await authClient.twoFactor.verifyBackupCode({
            code: twoFactorCode.trim(),
          })
        if (backupError) {
          setTwoFactorError(
            backupError.message ?? "Invalid recovery backup code.",
          )
          setTwoFactorLoading(false)
          return
        }
      }

      toast.success("Multi-Factor authentication successful!")
      const sessionRes = await authClient.getSession()
      const role =
        (sessionRes.data?.user as { role?: string } | undefined)?.role ??
        "PATIENT"
      const dashboard =
        role === "ADMIN"
          ? "/admin/dashboard"
          : role === "DOCTOR"
            ? "/doctor/dashboard"
            : "/patient/dashboard"
      window.location.href = dashboard
    } catch (err) {
      setTwoFactorError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during verification.",
      )
      setTwoFactorLoading(false)
    }
  }

  function handleSocialClick(provider: "google") {
    setOauthProvider(provider)
    setShowOAuthModal(true)
  }

  async function handleRealOAuth() {
    if (!oauthProvider) return
    setShowOAuthModal(false)
    toast.loading("Redirecting to Google...")
    await authClient.signIn.social({
      provider: oauthProvider,
      callbackURL: "/patient/dashboard",
    })
  }

  async function handleSimulatedOAuth() {
    if (!oauthProvider) return
    setIsSimulating(true)
    const mockEmail = `mock.${oauthProvider}@example.com`
    const mockName = "Mock Google User"
    const mockPassword = `mockoauthpassword_${oauthProvider}`

    try {
      const signInRes = await authClient.signIn.email({
        email: mockEmail,
        password: mockPassword,
      })

      if (signInRes.error) {
        const signUpRes = await authClient.signUp.email({
          email: mockEmail,
          password: mockPassword,
          name: mockName,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${oauthProvider === "google" ? "Sophia" : "Felix"}`,
        })

        if (signUpRes.error) {
          toast.error(`Simulation signup failed: ${signUpRes.error.message}`)
          setIsSimulating(false)
          return
        }

        const retrySignIn = await authClient.signIn.email({
          email: mockEmail,
          password: mockPassword,
        })

        if (retrySignIn.error) {
          toast.error(`Simulation sign-in failed: ${retrySignIn.error.message}`)
          setIsSimulating(false)
          return
        }
      }

      toast.success("Successfully simulated Google authentication!")
      setShowOAuthModal(false)
      window.location.href = "/patient/dashboard"
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSimulating(false)
    }
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
                    disabled={twoFactorLoading}
                    className="pl-10 font-mono tracking-wider"
                    required
                    autoFocus
                  />
                </div>
              </Field>

              {twoFactorError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
                  <ShieldAlert className="size-4 shrink-0" />
                  <p>{twoFactorError}</p>
                </div>
              )}

              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={twoFactorLoading}
                >
                  {twoFactorLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying Code...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
              </Field>
            </FieldGroup>

            <button
              type="button"
              className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setShowTwoFactor(false)
                setTwoFactorCode("")
                setTwoFactorError(null)
              }}
            >
              <ArrowLeft className="size-3" />
              Back to standard sign in
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit}
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
              type="email"
              placeholder="m@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
              disabled={loading}
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
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
              disabled={loading}
            />
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
              <ShieldAlert className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>

          <Field>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleSocialClick("google")}
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
            </div>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>

      <Dialog open={showOAuthModal} onOpenChange={setShowOAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              OAuth Simulation Fallback
            </DialogTitle>
            <DialogDescription>
              How would you like to authenticate via <strong>Google</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 space-y-3">
            <Button className="w-full" onClick={handleRealOAuth}>
              Real OAuth Redirect
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={isSimulating}
              onClick={handleSimulatedOAuth}
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Simulating OAuth Flow...
                </>
              ) : (
                "Simulate Locally (Mock Profile)"
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowOAuthModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
