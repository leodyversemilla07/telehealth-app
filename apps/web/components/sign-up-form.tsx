"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
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
import { GalleryVerticalEndIcon, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { PasswordInput } from "@/components/password-input"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
import { type SignUpState, submitSignUp } from "./sign-up-submit"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
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
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"PATIENT" | "DOCTOR">(
    "PATIENT",
  )
  const [consent, setConsent] = useState(false)
  const [showConsentAlert, setShowConsentAlert] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")
  const [confirmValue, setConfirmValue] = useState("")

  const passwordsMismatch =
    confirmValue.length > 0 && confirmValue !== passwordValue

  const [verificationState, setVerificationState] = useState<
    "idle" | "sending" | "sent"
  >("idle")

  const [state, formAction, isPending] = useActionState<SignUpState, FormData>(
    async (_prev, formData) => {
      const password = formData.get("password") as string
      const confirmPassword = formData.get("confirmPassword") as string

      if (password !== confirmPassword) {
        return {
          error: "Passwords do not match. Please re-enter them.",
          success: false,
          email: "",
          role: selectedRole,
        }
      }

      const result = await submitSignUp(formData, consent, {
        signUpEmail: (input) =>
          authClient.signUp.email(
            input as unknown as Parameters<typeof authClient.signUp.email>[0],
          ),
        recordConsent: (data) => apiClient.post("/consent", data),
      })
      if (result.success) toast.success("Account created successfully!")
      return result
    },
    { error: null, success: false, email: "", role: "PATIENT" },
  )

  /**
   * Intercept form submission: if the consent checkbox is not ticked, block
   * the server action and surface a privacy-consent alert dialog instead of
   * silently failing (F-AUTH-07).
   */
  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!consent) {
      e.preventDefault()
      setShowConsentAlert(true)
    }
  }

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-6 text-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 font-medium"
          >
            <div className="flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEndIcon className="size-6" />
            </div>
            <span className="sr-only">Telehealth</span>
          </Link>
          <h1 className="text-xl font-bold">Check your email</h1>
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
        <Button
          variant="outline"
          onClick={async () => {
            setVerificationState("sending")
            const { error } = await authClient.sendVerificationEmail({
              email: state.email,
              callbackURL: `${window.location.origin}/sign-in`,
            })

            if (error) {
              setVerificationState("idle")
              toast.error(
                error.message ?? "Could not resend the verification email.",
              )
              return
            }

            setVerificationState("sent")
            toast.success("Verification email sent. Please check your inbox.")
          }}
          disabled={
            verificationState === "sending" || verificationState === "sent"
          }
        >
          {verificationState === "sending" ? (
            <>
              <Spinner data-icon="inline-start" />
              Sending verification email...
            </>
          ) : verificationState === "sent" ? (
            "Verification email sent"
          ) : (
            "Resend verification email"
          )}
        </Button>
        <p className="-mt-3 text-center text-xs text-muted-foreground">
          Don&apos;t see it? Check your spam or junk folder.
        </p>
        <Button variant="outline" onClick={() => router.push("/sign-in")}>
          Go to Sign In
        </Button>
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
      <form action={formAction} onSubmit={handleFormSubmit}>
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
            <h1 className="text-xl font-bold">Create an account</h1>
            <FieldDescription>
              Already have an account?{" "}
              <Link href="/sign-in" className="underline underline-offset-4">
                Sign in
              </Link>
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel>Full Name</FieldLabel>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First"
                  disabled={isPending}
                  required
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Input
                  id="middleName"
                  name="middleName"
                  type="text"
                  placeholder="Middle"
                  disabled={isPending}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last"
                  disabled={isPending}
                  required
                  className="w-full"
                />
              </div>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              disabled={isPending}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
              required
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
              required
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              aria-invalid={passwordsMismatch || undefined}
              aria-describedby={
                passwordsMismatch ? "confirmPassword-error" : undefined
              }
            />
            {passwordsMismatch && (
              <p
                id="confirmPassword-error"
                role="alert"
                className="mt-1 text-xs text-destructive"
              >
                Passwords do not match.
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>I want to join as</FieldLabel>
            <input type="hidden" name="role" value={selectedRole} />
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRole("PATIENT")}
                disabled={isPending}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer h-auto w-full",
                  !isPending && selectedRole === "PATIENT"
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
                disabled={isPending}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer h-auto w-full",
                  !isPending && selectedRole === "DOCTOR"
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

          <Field>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={isPending}
                className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-describedby="consent-desc"
              />
              <label
                htmlFor="consent"
                className={cn(
                  "text-sm leading-relaxed",
                  isPending
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground",
                )}
              >
                I have read and agree to the{" "}
                <Link
                  href="/patient/settings/privacy"
                  className="text-primary underline underline-offset-4"
                >
                  Privacy Policy
                </Link>{" "}
                and consent to the processing of my personal data in accordance
                with the Data Privacy Act of 2012 (RA 10173).
              </label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground px-1">
              For data privacy concerns, contact our Data Protection Officer at{" "}
              <a
                href="mailto:dpo@tele-health.app"
                className="underline underline-offset-2"
              >
                dpo@tele-health.app
              </a>
              .
            </p>
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
        </FieldGroup>
      </form>

      {/* Privacy-consent alert: shown when Create Account is clicked without
          ticking the consent checkbox (F-AUTH-07). The server-side submitSignUp
          check remains as a fallback. */}
      <AlertDialog
        open={showConsentAlert}
        onOpenChange={(open) => {
          if (!open) setShowConsentAlert(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ShieldAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>Privacy consent required</AlertDialogTitle>
            <AlertDialogDescription>
              You must agree to our <Link href="/privacy">Privacy Policy</Link>{" "}
              before creating an account. We process your personal data in
              accordance with the Data Privacy Act of 2012 (RA 10173). Please
              review the policy and tick the consent checkbox to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConsent(true)
                setShowConsentAlert(false)
              }}
            >
              I agree
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
