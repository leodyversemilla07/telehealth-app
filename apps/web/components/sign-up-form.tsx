"use client"

import type { SignUpDto } from "@workspace/shared"
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
import { Loader2, ShieldAlert, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const _router = useRouter()
  const [form, setForm] = useState<SignUpDto>({
    name: "",
    email: "",
    password: "",
    role: "PATIENT",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showOAuthModal, setShowOAuthModal] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<"google" | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signUpError } = await authClient.signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(signUpError.message ?? signUpError.statusText)
      setLoading(false)
      return
    }

    if (form.role === "DOCTOR") {
      try {
        await apiClient.patch("/users/me", { role: "DOCTOR" })
      } catch {
        setError("Account created but role update failed. Contact support.")
        setLoading(false)
        return
      }
    }

    toast.success("Account created successfully!")
    if (form.role === "DOCTOR") {
      window.location.href = "/doctor/register"
    } else {
      window.location.href = "/patient/dashboard"
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

  return (
    <>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Create an account</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Enter your details to get started
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={loading}
            />
          </Field>

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
            <FieldLabel htmlFor="password">Password</FieldLabel>
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

          <Field>
            <FieldLabel>I want to join as</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: "PATIENT" }))}
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer",
                  form.role === "PATIENT"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/30",
                )}
              >
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Patient
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: "DOCTOR" }))}
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer",
                  form.role === "DOCTOR"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/30",
                )}
              >
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
                  />
                </svg>
                Doctor
              </button>
            </div>
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
                  Creating account...
                </>
              ) : (
                "Create Account"
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
              Already have an account?{" "}
              <Link href="/sign-in" className="underline underline-offset-4">
                Sign in
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
