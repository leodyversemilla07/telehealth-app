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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Loader2, ShieldAlert, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState<SignUpDto>({
    name: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Social Login Mock / OAuth states
  const [showOAuthModal, setShowOAuthModal] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<
    "google" | "github" | null
  >(null)
  const [isSimulating, setIsSimulating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signUpError } = await authClient.signUp.email(form)

    if (signUpError) {
      setError(signUpError.message ?? signUpError.statusText)
      setLoading(false)
      return
    }

    toast.success("Account created successfully!")
    router.push("/")
    router.refresh()
  }

  function handleSocialClick(provider: "google" | "github") {
    setOauthProvider(provider)
    setShowOAuthModal(true)
  }

  async function handleRealOAuth() {
    if (!oauthProvider) return
    setShowOAuthModal(false)
    toast.loading(
      `Redirecting to ${oauthProvider === "google" ? "Google" : "GitHub"}...`,
    )
    await authClient.signIn.social({
      provider: oauthProvider,
      callbackURL: "/",
    })
  }

  async function handleSimulatedOAuth() {
    if (!oauthProvider) return
    setIsSimulating(true)
    const mockEmail = `mock.${oauthProvider}@example.com`
    const mockName = `Mock ${oauthProvider === "google" ? "Google" : "GitHub"} User`
    const mockPassword = `mockoauthpassword_${oauthProvider}`

    try {
      // 1. Attempt standard email sign-in first
      const signInRes = await authClient.signIn.email({
        email: mockEmail,
        password: mockPassword,
      })

      if (signInRes.error) {
        // 2. If user doesn't exist, sign up the mock profile first
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

        // 3. Retry sign-in
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

      toast.success(
        `Successfully simulated ${oauthProvider === "google" ? "Google" : "GitHub"} authentication!`,
      )
      setShowOAuthModal(false)
      router.push("/")
      router.refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Simulation error: ${errorMsg}`)
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-gradient-to-br from-background via-background/95 to-muted/10">
      <div className="w-full max-w-sm space-y-6 bg-card/65 backdrop-blur-md border border-border/30 p-8 rounded-2xl shadow-xl transition-all duration-300">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your details to get started with your new account
          </p>
        </div>

        {/* OAuth Brand Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => handleSocialClick("google")}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted/30 text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm hover:scale-[1.01] cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5 shrink-0"
              aria-hidden="true"
            >
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
          </button>

          {/* GitHub Button */}
          <button
            type="button"
            onClick={() => handleSocialClick("github")}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-slate-950 hover:bg-slate-900 text-white text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm hover:scale-[1.01] cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5 fill-current shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"
              />
            </svg>
            GitHub
          </button>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <span className="relative bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
            Or continue with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) =>
                setForm((f: SignUpDto) => ({ ...f, name: e.target.value }))
              }
              className="py-5 rounded-xl border-border/60"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((f: SignUpDto) => ({ ...f, email: e.target.value }))
              }
              className="py-5 rounded-xl border-border/60"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f: SignUpDto) => ({ ...f, password: e.target.value }))
              }
              className="py-5 rounded-xl border-border/60"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-xs pt-2">
          Already have an account?{" "}
          <a
            href="/sign-in"
            className="text-primary underline underline-offset-4 font-semibold hover:text-primary/80 transition-colors"
          >
            Sign In
          </a>
        </p>
      </div>

      {/* OAuth Simulation Modal */}
      <Dialog open={showOAuthModal} onOpenChange={setShowOAuthModal}>
        <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-md border border-border/40 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              OAuth Simulation Fallback
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              How would you like to authenticate via{" "}
              <strong>
                {oauthProvider === "google" ? "Google" : "GitHub"}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 space-y-3">
            <Button
              className="w-full py-4.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl transition-all duration-200 shadow-md shadow-primary/10 hover:scale-[1.01]"
              onClick={handleRealOAuth}
            >
              Real OAuth Redirect
            </Button>
            <Button
              variant="secondary"
              className="w-full py-4.5 bg-secondary/80 hover:bg-secondary border border-border/50 text-foreground font-semibold rounded-xl transition-all duration-200 hover:scale-[1.01]"
              disabled={isSimulating}
              onClick={handleSimulatedOAuth}
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating OAuth Flow...
                </>
              ) : (
                "Simulate Locally (Mock Profile)"
              )}
            </Button>
          </div>

          <DialogFooter className="-mx-6 -mb-6 bg-muted/20 border-t border-border/30 px-6 py-4 rounded-b-2xl flex gap-2 justify-end">
            <Button
              variant="ghost"
              className="hover:bg-accent/40 rounded-xl px-4 py-2"
              onClick={() => setShowOAuthModal(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
