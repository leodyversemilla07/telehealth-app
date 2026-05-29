"use client"

import type { SignUpDto } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { ShieldAlert } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
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
  const router = useRouter()
  const [form, setForm] = useState<SignUpDto>({
    name: "",
    email: "",
    password: "",
    role: "PATIENT",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)



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
      router.push("/doctor/register")
    } else {
      router.push("/patient/dashboard")
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
              required
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm((f) => ({ ...f, role: "PATIENT" }))}
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer h-auto w-full",
                  form.role === "PATIENT"
                    ? "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
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
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm((f) => ({ ...f, role: "DOCTOR" }))}
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer h-auto w-full",
                  form.role === "DOCTOR"
                    ? "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
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
              </Button>
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
                  <Spinner className="mr-2 size-4" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center">
              Already have an account?{" "}
              <Link href="/sign-in" className="underline underline-offset-4">
                Sign in
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>

    </>
  )
}
