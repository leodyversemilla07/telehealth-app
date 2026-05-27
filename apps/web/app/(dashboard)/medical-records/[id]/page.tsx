"use client"

import type { ConsultationWithPrescriptionsDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileText,
  Phone,
  Pill,
  RefreshCw,
  Stethoscope,
  User,
  Video,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useConsultation } from "@/hooks/use-records"

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} – ${formatTime(date)}`
}

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const visitTypeConfig: Record<
  string,
  {
    label: string
    icon: React.ElementType
    variant: "default" | "secondary" | "outline"
  }
> = {
  VIDEO: { label: "Video Call", icon: Video, variant: "default" },
  PHONE: { label: "Phone Call", icon: Phone, variant: "secondary" },
  IN_PERSON: { label: "In-Person", icon: User, variant: "outline" },
}

// ─── Loading Skeleton ────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-16 w-full animate-pulse rounded bg-muted" />
          </div>

          <div className="h-px w-full bg-muted" />

          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-12 w-full animate-pulse rounded bg-muted" />
          </div>

          <div className="h-px w-full bg-muted" />

          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-12 w-full animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-6 w-28 animate-pulse rounded bg-muted" />
            <div className="h-5 w-8 animate-pulse rounded-full bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-14 w-full animate-pulse rounded bg-muted" />
          <div className="h-14 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Error State ─────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Medical Records
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Failed to Load Consultation</h2>
          <p className="mt-2 text-muted-foreground">
            Something went wrong while fetching the consultation details. Please
            try again.
          </p>
          <Button className="mt-6" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Section Label ───────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
      {children}
    </h3>
  )
}

// ─── Consultation Detail ─────────────────────────────────────

function ConsultationDetail({
  consultation,
  onBack,
}: {
  consultation: ConsultationWithPrescriptionsDto
  onBack: () => void
}) {
  const doctorName = consultation.doctor.user.name || "Doctor"
  const visitType = visitTypeConfig[consultation.appointment.type]
  const VisitIcon = visitType?.icon ?? Stethoscope

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Medical Records
        </Button>
      </div>

      {/* ── Consultation Card ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl">{doctorName}</CardTitle>
            <Badge variant="secondary" className="text-sm">
              <Stethoscope className="mr-1 h-3.5 w-3.5" />
              {consultation.doctor.specialty}
            </Badge>
          </div>
          <CardDescription className="mt-1">
            Consultation on {formatDate(consultation.appointment.startTime)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Appointment Info */}
          <div>
            <SectionLabel>Appointment Details</SectionLabel>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-medium">
                  {formatDateTime(consultation.appointment.startTime)}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <VisitIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Type:</span>
                <Badge
                  variant={visitType?.variant ?? "outline"}
                  className="text-xs"
                >
                  {visitType?.label ?? consultation.appointment.type}
                </Badge>
              </li>
              {consultation.appointment.reason && (
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="font-medium">
                    {consultation.appointment.reason}
                  </span>
                </li>
              )}
              {consultation.appointment.symptoms && (
                <li className="flex items-start gap-2">
                  <Stethoscope className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Symptoms:</span>
                  <span className="font-medium">
                    {consultation.appointment.symptoms}
                  </span>
                </li>
              )}
            </ul>
          </div>

          <Separator />

          {/* Diagnosis */}
          {consultation.diagnosis && (
            <>
              <div
                className={cn(
                  "rounded-lg border-2 border-primary/20 bg-primary/5 p-4",
                )}
              >
                <SectionLabel>Diagnosis</SectionLabel>
                <p className="text-sm font-medium leading-relaxed">
                  {consultation.diagnosis}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Doctor Notes */}
          {consultation.doctorNotes && (
            <>
              <div>
                <SectionLabel>Doctor Notes</SectionLabel>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {consultation.doctorNotes}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Treatment Plan */}
          {consultation.plan && (
            <>
              <div>
                <SectionLabel>Treatment Plan</SectionLabel>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {consultation.plan}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Patient Notes */}
          {consultation.patientNotes && (
            <div>
              <SectionLabel>Patient Notes</SectionLabel>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {consultation.patientNotes}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          <div className="flex w-full items-center justify-between">
            <span>Created: {formatTimestamp(consultation.createdAt)}</span>
            <span>Updated: {formatTimestamp(consultation.updatedAt)}</span>
          </div>
        </CardFooter>
      </Card>

      {/* ── Prescriptions Card ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescriptions
            </CardTitle>
            {consultation.prescriptions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {consultation.prescriptions.length}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {consultation.prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Pill className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No prescriptions were issued for this consultation.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {consultation.prescriptions.map((rx) => (
                <li key={rx.id} className="rounded-lg border bg-card px-4 py-3">
                  <p className="text-base font-semibold">{rx.medicationName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rx.dosage}
                    <span className="mx-1.5">·</span>
                    {rx.frequency}
                    <span className="mx-1.5">·</span>
                    {rx.duration}
                  </p>
                  {rx.instructions && (
                    <p className="mt-1 text-sm italic text-muted-foreground">
                      {rx.instructions}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Page Component ──────────────────────────────────────────

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const {
    data: consultation,
    isLoading,
    isError,
    refetch,
  } = useConsultation(id)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError || !consultation) {
    return (
      <ErrorState
        onRetry={() => {
          if (isError) {
            refetch()
          } else {
            router.push("/medical-records")
          }
        }}
      />
    )
  }

  return (
    <ConsultationDetail
      consultation={consultation}
      onBack={() => router.push("/medical-records")}
    />
  )
}
