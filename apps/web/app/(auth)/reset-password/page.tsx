"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { CheckCircle2, Key, Loader2, Lock, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError("Missing reset token. Use the link from your email.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    })

    if (resetError) {
      setError(resetError.message ?? "Failed to reset password.")
      setLoading(false)
      return
    }

    toast.success("Password reset successfully!")
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-gradient-to-br from-background via-background/95 to-muted/10">
        <div className="w-full max-w-sm space-y-6 bg-card/65 backdrop-blur-md border border-border/30 p-8 rounded-2xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">
              Password updated
            </h1>
            <p className="text-sm text-muted-foreground">
              Your password has been reset successfully.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Sign in with new password
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
            Set new password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 py-5 rounded-xl border-border/60"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 py-5 rounded-xl border-border/60"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-5 rounded-xl text-sm font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
