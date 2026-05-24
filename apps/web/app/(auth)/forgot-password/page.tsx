"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldAlert,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Simulated — Better Auth email verification not configured for dev
    await new Promise((r) => setTimeout(r, 1000))

    toast.success(
      "If this email exists, you'll receive a password reset link shortly.",
    )
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-gradient-to-br from-background via-background/95 to-muted/10">
        <div className="w-full max-w-sm space-y-6 bg-card/65 backdrop-blur-md border border-border/30 p-8 rounded-2xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;ve sent a password reset link to{" "}
              <strong className="text-foreground">{email}</strong>. It will expire in 1 hour.
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
          <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
          <p className="text-muted-foreground text-sm">
            Enter the email address linked to your account and we&apos;ll send you a recovery link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                Sending link...
              </>
            ) : (
              "Send recovery link"
            )}
          </Button>
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