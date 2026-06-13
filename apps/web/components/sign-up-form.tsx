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
import { ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

type SignUpState = {
  error: string | null
  success: boolean
  email: string
  role: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner className="mr-2 size-4" />
          Creating account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"PATIENT" | "DOCTOR">(
    "PATIENT",
  )

  const [state, formAction] = useActionState<SignUpState, FormData>(
    async (_prev, formData) => {
      const name = formData.get("name") as string
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const role = formData.get("role") as string

      if (!name || !email || !password) {
        return {
          error: "All fields are required",
          success: false,
          email: "",
          role,
        }
      }

      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
        role,
      } as unknown as Parameters<typeof authClient.signUp.email>[0])

      if (signUpError) {
        return {
          error:
            signUpError.message ?? signUpError.statusText ?? "Sign up failed",
          success: false,
          email: "",
          role,
        }
      }

      toast.success("Account created successfully!")
      return { error: null, success: true, email, role }
    },
    { error: null, success: false, email: "", role: "PATIENT" },
  )

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-6 text-center p-8">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            className="size-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-label="Email"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground mt-2">
            We sent a verification link to
            <br />
            <span className="font-medium text-foreground">{state.email}</span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {state.role === "DOCTOR"
            ? "After verifying, sign in and complete the doctor application from the doctor registration page."
            : "Click the link in the email to verify your account and sign in."}
        </p>
        <Button variant="outline" onClick={() => router.push("/sign-in")}>
          Go to Sign In
        </Button>
      </div>
    )
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      action={formAction}
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
            name="name"
            type="text"
            placeholder="John Doe"
            required
          />
        </Field>

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
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </Field>

        <Field>
          <FieldLabel>I want to join as</FieldLabel>
          <input type="hidden" name="role" value={selectedRole} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedRole("PATIENT")}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer h-auto w-full",
                selectedRole === "PATIENT"
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
                aria-label="Patient"
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
              onClick={() => setSelectedRole("DOCTOR")}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer h-auto w-full",
                selectedRole === "DOCTOR"
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
                aria-label="Doctor"
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

        {state.error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
            <ShieldAlert className="size-4 shrink-0" />
            <p>{state.error}</p>
          </div>
        )}

        <Field>
          <SubmitButton />
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
  )
}
