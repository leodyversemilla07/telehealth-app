"use client"

import type { SignInDto } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowLeft,
  Key,
  Shield,
  ShieldAlert,
} from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [form, setForm] = useState<SignInDto>({ email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null)



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
    router.push(dashboard)
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
      router.push(dashboard)
    } catch (err) {
      setTwoFactorError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during verification.",
      )
      setTwoFactorLoading(false)
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
                      <Spinner className="mr-2 size-4" />
                      Verifying Code...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
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
                setTwoFactorError(null)
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
                  <Spinner className="mr-2 size-4" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
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

    </>
  )
}
