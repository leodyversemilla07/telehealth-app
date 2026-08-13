"use client"

import { TRPCClientError } from "@trpc/client"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "@workspace/ui/components/toast"
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  PencilLine,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useTRPCClient } from "@/lib/trpc/client"

const SPECIALTIES = [
  "General Practitioner",
  "Internal Medicine",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "Psychiatry",
  "Ophthalmology",
  "ENT",
  "Pulmonology",
  "Gastroenterology",
  "Urology",
  "Endocrinology",
  "Radiology",
  "Anesthesiology",
  "Pathology",
  "Emergency Medicine",
  "Family Medicine",
  "Surgery",
  "Other",
]

interface DoctorApplication {
  specialty: string
  prcLicenseNumber: string
  prcLicenseExpiry: string
  philhealthAccreditation: string | null
  pdeaS2License: string | null
  pdeaS2Expiry: string | null
  bio: string | null
  clinicAddress: string | null
  pricePerVisit: number | string
  isApproved: boolean
  rejectionReason: string | null
}

type ApplicationState =
  | { status: "loading" }
  | { status: "none" }
  | { status: "review"; application: DoctorApplication }
  | { status: "editing"; application: DoctorApplication }

const EMPTY_FORM = {
  specialty: "",
  prcLicenseNumber: "",
  prcLicenseExpiry: "",
  philhealthAccreditation: "",
  pdeaS2License: "",
  pdeaS2Expiry: "",
  bio: "",
  clinicAddress: "",
  pricePerVisit: "",
}

function applicationToForm(app: DoctorApplication) {
  return {
    specialty: app.specialty,
    prcLicenseNumber: app.prcLicenseNumber,
    prcLicenseExpiry: app.prcLicenseExpiry
      ? (new Date(app.prcLicenseExpiry).toISOString().split("T")[0] ?? "")
      : "",
    philhealthAccreditation: app.philhealthAccreditation ?? "",
    pdeaS2License: app.pdeaS2License ?? "",
    pdeaS2Expiry: app.pdeaS2Expiry
      ? (new Date(app.pdeaS2Expiry).toISOString().split("T")[0] ?? "")
      : "",
    bio: app.bio ?? "",
    clinicAddress: app.clinicAddress ?? "",
    pricePerVisit: app.pricePerVisit ? String(app.pricePerVisit) : "",
  }
}

function formAsApplication(form = EMPTY_FORM): DoctorApplication {
  return {
    specialty: form.specialty,
    prcLicenseNumber: form.prcLicenseNumber,
    prcLicenseExpiry: form.prcLicenseExpiry,
    philhealthAccreditation: form.philhealthAccreditation || null,
    pdeaS2License: form.pdeaS2License || null,
    pdeaS2Expiry: form.pdeaS2Expiry || null,
    bio: form.bio || null,
    clinicAddress: form.clinicAddress || null,
    pricePerVisit: form.pricePerVisit || 0,
    isApproved: false,
    rejectionReason: null,
  }
}

function formAsPayload(form = EMPTY_FORM) {
  return {
    specialty: form.specialty,
    prcLicenseNumber: form.prcLicenseNumber,
    prcLicenseExpiry: form.prcLicenseExpiry,
    philhealthAccreditation: form.philhealthAccreditation || null,
    pdeaS2License: form.pdeaS2License || null,
    pdeaS2Expiry: form.pdeaS2Expiry || null,
    bio: form.bio || null,
    clinicAddress: form.clinicAddress || null,
    // null (not 0) so the API's IsOptional + IsDecimal validation passes;
    // the API defaults a missing price to 0.
    pricePerVisit: form.pricePerVisit || null,
  }
}

function licenseDaysLeft(expiry: string): number {
  const ms = new Date(expiry).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function DoctorRegisterPage() {
  const router = useRouter()
  const trpcClient = useTRPCClient()
  const [state, setState] = useState<ApplicationState>({ status: "loading" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    let cancelled = false

    async function loadApplication() {
      try {
        const profile = await trpcClient.doctors.myProfile.query()
        if (cancelled) return
        setState({ status: "review", application: profile })
      } catch (err: unknown) {
        if (cancelled) return
        if (
          err instanceof TRPCClientError &&
          // 404: no profile yet. 403: the session role is still PATIENT, so
          // the role-guarded myProfile procedure refuses — treat as no
          // application (a non-DOCTOR role cannot have a doctor profile).
          (err.data?.httpStatus === 404 || err.data?.httpStatus === 403)
        ) {
          // No application yet — show the registration form.
          setState({ status: "none" })
        } else {
          setState({ status: "none" })
          setError(
            err instanceof Error
              ? err.message
              : "Could not load your application. Please try again.",
          )
        }
      }
    }

    loadApplication()
    return () => {
      cancelled = true
    }
  }, [trpcClient])

  function startEditing(application: DoctorApplication) {
    setForm(applicationToForm(application))
    setError(null)
    setState({ status: "editing", application })
  }

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Send the null-normalized payload (empty strings would fail the
      // API's ISO 8601 / decimal validation on optional fields).
      await trpcClient.doctors.register.mutate(formAsPayload(form))
      toast.add({ title: "Application submitted for review!", type: "success" })
      const submitted = formAsApplication(form)
      setForm(EMPTY_FORM)
      // Registering flips the DB role to DOCTOR; the session token still
      // carries the old role until refreshed. Re-fetch the session so the
      // doctor layout + profile endpoints see DOCTOR, then show the pending
      // card (no profile re-fetch needed — the new state is always pending).
      await authClient.getSession().catch(() => null)
      setState({ status: "review", application: submitted })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (state.status === "loading") {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          <div className="flex flex-col items-center gap-3 py-6">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-7 w-64 rounded" />
            <Skeleton className="h-4 w-80 max-w-full rounded" />
          </div>
          <Card>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isEditing = state.status === "editing"

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <div className="max-w-2xl mx-auto w-full">
        {state.status === "review" && (
          <ApplicationStatusCard
            application={state.application}
            onEdit={() => startEditing(state.application)}
          />
        )}

        {(state.status === "none" || isEditing) && (
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-3">
                <Stethoscope className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {isEditing
                  ? "Edit Your Doctor Profile"
                  : "Complete Your Doctor Profile"}
              </CardTitle>
              <CardDescription className="text-sm">
                {isEditing
                  ? "Your application will be re-submitted for admin review after you save your changes."
                  : "Provide your professional details to complete registration. Your profile will be reviewed by our admin team for verification."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Professional Information */}
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Professional Information
                  </p>

                  <Field>
                    <FieldLabel htmlFor="specialty">Specialty *</FieldLabel>
                    <Select
                      value={form.specialty}
                      onValueChange={(v) => update("specialty", v ?? "")}
                    >
                      <SelectTrigger id="specialty">
                        <SelectValue placeholder="Select your specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {SPECIALTIES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prcLicenseNumber">
                        PRC License Number *
                      </Label>
                      <Input
                        id="prcLicenseNumber"
                        placeholder="e.g. 123456"
                        value={form.prcLicenseNumber}
                        onChange={(e) =>
                          update("prcLicenseNumber", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prcLicenseExpiry">
                        PRC License Expiry *
                      </Label>
                      <DatePicker
                        id="prcLicenseExpiry"
                        value={form.prcLicenseExpiry}
                        onChange={(val) => update("prcLicenseExpiry", val)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="philhealthAccreditation">
                        PhilHealth Accreditation
                      </Label>
                      <Input
                        id="philhealthAccreditation"
                        placeholder="e.g. PHIC-123456"
                        value={form.philhealthAccreditation}
                        onChange={(e) =>
                          update("philhealthAccreditation", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pdeaS2License">PDEA S2 License</Label>
                      <Input
                        id="pdeaS2License"
                        placeholder="e.g. PDEA-S2-123456"
                        value={form.pdeaS2License}
                        onChange={(e) =>
                          update("pdeaS2License", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {form.pdeaS2License && (
                    <div className="space-y-2">
                      <Label htmlFor="pdeaS2Expiry">PDEA S2 Expiry</Label>
                      <DatePicker
                        id="pdeaS2Expiry"
                        value={form.pdeaS2Expiry}
                        onChange={(val) => update("pdeaS2Expiry", val)}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Practice Details */}
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Practice Details
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Clinic Address</Label>
                    <Input
                      id="clinicAddress"
                      placeholder="e.g. 123 Medical Plaza, Makati City"
                      value={form.clinicAddress}
                      onChange={(e) => update("clinicAddress", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricePerVisit">Price per Visit (PHP)</Label>
                    <Input
                      id="pricePerVisit"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 500.00"
                      value={form.pricePerVisit}
                      onChange={(e) => update("pricePerVisit", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      className="min-h-[100px]"
                      placeholder="Tell patients about yourself, your experience, and your approach to care..."
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {form.bio.length}/500
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
                    <ShieldAlert className="size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      isEditing
                        ? setState({
                            status: "review",
                            application: state.application,
                          })
                        : router.push("/patient/dashboard")
                    }
                  >
                    {isEditing ? "Cancel" : "Skip for now"}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      loading ||
                      !form.specialty ||
                      !form.prcLicenseNumber ||
                      !form.prcLicenseExpiry
                    }
                  >
                    {loading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Submitting...
                      </>
                    ) : isEditing ? (
                      "Resubmit Application"
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ApplicationStatusCard({
  application,
  onEdit,
}: {
  application: DoctorApplication
  onEdit: () => void
}) {
  const approved = application.isApproved
  const rejected = !approved && Boolean(application.rejectionReason)

  if (approved) {
    const daysLeft = licenseDaysLeft(application.prcLicenseExpiry)
    return (
      <Card className="border border-success/30 bg-success/5">
        <CardHeader className="pb-3">
          <div className="h-12 w-12 rounded-xl border bg-success/10 border-success/20 text-success flex items-center justify-center">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Application Approved
          </CardTitle>
          <CardDescription className="text-sm">
            Your doctor profile is live and patients can now book appointments
            with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {daysLeft < 0 ? (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
              <XCircle className="size-4 shrink-0" />
              <p>
                Your PRC license expired {Math.abs(daysLeft)} day
                {Math.abs(daysLeft) !== 1 ? "s" : ""} ago. Your profile is
                currently hidden from patients until you renew it.
              </p>
            </div>
          ) : daysLeft <= 90 ? (
            <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 border border-warning/20 p-3 rounded-xl">
              <Clock className="size-4 shrink-0" />
              <p>
                Your PRC license expires in {daysLeft} day
                {daysLeft !== 1 ? "s" : ""}. Renew it to keep your profile
                visible to patients.
              </p>
            </div>
          ) : null}
          <Link
            href="/doctor/dashboard"
            className={buttonVariants({ className: "flex-1 gap-2" })}
          >
            <CheckCircle2 className="h-4 w-4" />
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (rejected) {
    return (
      <Card className="border border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="h-12 w-12 rounded-xl border bg-destructive/10 border-destructive/20 text-destructive flex items-center justify-center">
            <XCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Application Rejected
          </CardTitle>
          <CardDescription className="text-sm">
            Your application did not pass review. Fix the issue below and
            resubmit — you will be back to pending review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm bg-card border border-border/40 p-3 rounded-xl">
            <ShieldAlert className="size-4 shrink-0 mt-0.5 text-destructive" />
            <div>
              <p className="font-medium text-foreground">
                Reason for rejection
              </p>
              <p className="text-muted-foreground">
                {application.rejectionReason}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/doctor/dashboard"
              className={buttonVariants({
                variant: "outline",
                className: "flex-1",
              })}
            >
              Go to dashboard
            </Link>
            <Button className="flex-1 gap-2" onClick={onEdit}>
              <RotateCcw className="h-4 w-4" />
              Edit &amp; resubmit
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pending review
  return (
    <Card className="border border-warning/30 bg-warning/5">
      <CardHeader className="pb-3">
        <div className="h-12 w-12 rounded-xl border bg-warning/10 border-warning/20 text-warning flex items-center justify-center">
          <Clock className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Application Under Review
        </CardTitle>
        <CardDescription className="text-sm">
          Your application has been submitted and is being reviewed by our admin
          team. This usually takes 1–2 business days. You can continue using the
          app while you wait.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Link
          href="/doctor/dashboard"
          className={buttonVariants({
            variant: "outline",
            className: "flex-1",
          })}
        >
          Go to dashboard
        </Link>
        <Button variant="outline" className="flex-1 gap-2" onClick={onEdit}>
          <PencilLine className="h-4 w-4" />
          Edit details
        </Button>
      </CardContent>
    </Card>
  )
}
