"use client"

import type {
  ConsultationWithPrescriptionsDto,
  PrescriptionDto,
} from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  FileText,
  Pill,
  RefreshCw,
  Stethoscope,
  Syringe,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { usePatientPrescriptions, usePatientRecords } from "@/hooks/use-records"

// ── Date formatting ───────────────────────────────────────────────────────────

const shortDateFormatter = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

// ── Tab type ──────────────────────────────────────────────────────────────────

type TabKey = "consultations" | "prescriptions"

// ── Skeletons ─────────────────────────────────────────────────────────────────

function ConsultationCardSkeleton() {
  return (
    <Card className="animate-pulse bg-card/60 border-border/40">
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="h-5 w-20 bg-muted rounded-full" />
      </CardHeader>
      <CardContent className="space-y-3 py-2">
        <div className="h-3 w-40 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-28 bg-muted rounded" />
      </CardContent>
    </Card>
  )
}

function PrescriptionRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 rounded-lg border border-border/40 bg-card/60 p-4">
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-3 w-48 bg-muted rounded" />
      </div>
      <div className="h-3 w-24 bg-muted rounded" />
    </div>
  )
}

// ── Consultation Card ─────────────────────────────────────────────────────────

function ConsultationCard({
  consultation,
  onClick,
}: {
  consultation: ConsultationWithPrescriptionsDto
  onClick: () => void
}) {
  const doctorName = consultation.doctor.user.name || "Doctor"
  const specialty = consultation.doctor.specialty
  const date = shortDateFormatter.format(
    new Date(consultation.appointment.startTime),
  )
  const diagnosis = consultation.diagnosis
  const doctorNotes = consultation.doctorNotes
  const plan = consultation.plan
  const prescriptionCount = consultation.prescriptions.length

  return (
    <Card
      className="group relative overflow-hidden border border-border/40 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 bg-card transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Left accent band */}
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />

      <CardHeader className="flex flex-row items-start gap-4 pb-3 pl-5">
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Stethoscope className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <CardTitle className="truncate text-sm font-semibold text-foreground">
            {doctorName}
          </CardTitle>
          {specialty && (
            <CardDescription className="text-xs truncate">
              {specialty}
            </CardDescription>
          )}
        </div>

        {diagnosis ? (
          <Badge
            variant="default"
            className="shrink-0 text-[10px] h-5 font-semibold border bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
          >
            {diagnosis.length > 20 ? `${diagnosis.slice(0, 20)}…` : diagnosis}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="shrink-0 text-[10px] h-5 font-semibold border bg-muted text-muted-foreground border-muted-foreground/25"
          >
            No diagnosis
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pl-5 pb-4">
        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/70" />
          <span>{date}</span>
        </div>

        {/* Doctor notes (truncated to 2 lines) */}
        {doctorNotes && (
          <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
            {doctorNotes}
          </p>
        )}

        {/* Treatment plan */}
        {plan && (
          <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
            <p className="text-[11px] font-medium text-primary/80 mb-0.5">
              Treatment Plan
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
              {plan}
            </p>
          </div>
        )}

        <Separator className="!mt-4" />

        {/* Footer: prescriptions count */}
        <div className="flex items-center gap-2 !mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Pill className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              {prescriptionCount === 0
                ? "No prescriptions"
                : `${prescriptionCount} prescription${prescriptionCount > 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Prescription Row ──────────────────────────────────────────────────────────

function PrescriptionRow({
  prescription,
  consultationMap,
}: {
  prescription: PrescriptionDto
  consultationMap: Map<string, ConsultationWithPrescriptionsDto>
}) {
  const consultation = consultationMap.get(prescription.consultationId)
  const doctorName = consultation?.doctor.user.name || "Unknown Doctor"
  const consultationDate = consultation
    ? shortDateFormatter.format(new Date(consultation.appointment.startTime))
    : "Unknown date"

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-card p-4 hover:border-primary/20 hover:shadow-sm transition-all duration-200 sm:flex-row sm:items-center sm:gap-4">
      {/* Icon */}
      <div className="h-9 w-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
        <Syringe className="h-4 w-4" />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground truncate">
          {prescription.medicationName}
        </p>
        <p className="text-xs text-muted-foreground">
          {prescription.dosage} &middot; {prescription.frequency} &middot;{" "}
          {prescription.duration}
        </p>
        {prescription.instructions && (
          <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-1">
            {prescription.instructions}
          </p>
        )}
      </div>

      {/* Consultation reference */}
      <div className="text-xs text-muted-foreground shrink-0 text-right sm:text-right">
        <p>{consultationDate}</p>
        <p className="text-muted-foreground/70">Dr. {doctorName}</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MedicalRecordsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>("consultations")

  const {
    data: consultations,
    isPending: consultationsLoading,
    error: consultationsError,
    refetch: refetchConsultations,
  } = usePatientRecords()

  const {
    data: prescriptions,
    isPending: prescriptionsLoading,
    error: prescriptionsError,
    refetch: refetchPrescriptions,
  } = usePatientPrescriptions()

  // Build a map of consultationId -> consultation for prescription rows
  const consultationMap = new Map<string, ConsultationWithPrescriptionsDto>()
  if (consultations) {
    for (const c of consultations) {
      consultationMap.set(c.id, c)
    }
  }

  // Sort consultations by most recent first
  const sortedConsultations = consultations
    ? [...consultations].sort(
        (a, b) =>
          new Date(b.appointment.startTime).getTime() -
          new Date(a.appointment.startTime).getTime(),
      )
    : []

  // Sort prescriptions by most recent first
  const sortedPrescriptions = prescriptions
    ? [...prescriptions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : []

  // Tab counts
  const counts = {
    consultations: consultations?.length ?? 0,
    prescriptions: prescriptions?.length ?? 0,
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "consultations",
      label: "Consultations",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      key: "prescriptions",
      label: "Prescriptions",
      icon: <Pill className="h-4 w-4" />,
    },
  ]

  // Current tab state
  const isLoading =
    activeTab === "consultations" ? consultationsLoading : prescriptionsLoading
  const error =
    activeTab === "consultations" ? consultationsError : prescriptionsError
  const refetch =
    activeTab === "consultations" ? refetchConsultations : refetchPrescriptions
  const isEmpty =
    activeTab === "consultations"
      ? !consultationsLoading &&
        !consultationsError &&
        sortedConsultations.length === 0
      : !prescriptionsLoading &&
        !prescriptionsError &&
        sortedPrescriptions.length === 0

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Medical Records
            </h1>
            <p className="text-sm text-muted-foreground">
              Your consultation history and prescriptions
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl bg-card border border-border/40 p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent",
            )}
          >
            {tab.icon}
            {tab.label}
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === tab.key
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {isLoading && activeTab === "consultations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton has no stable id
            <ConsultationCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {isLoading && activeTab === "prescriptions" && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton has no stable id
            <PrescriptionRowSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-sm">
              Failed to load{" "}
              {activeTab === "consultations"
                ? "consultations"
                : "prescriptions"}
            </h3>
            <p className="text-xs text-destructive/80 leading-relaxed">
              {error.message ||
                "An unexpected error occurred while fetching your records. Please try again."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {isEmpty && activeTab === "consultations" && (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">
              No consultations yet
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your consultation records will appear here after you complete an
              appointment with a doctor.
            </p>
          </div>
        </div>
      )}

      {isEmpty && activeTab === "prescriptions" && (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <Pill className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">
              No prescriptions yet
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Prescriptions from your consultations will appear here once your
              doctor prescribes medication.
            </p>
          </div>
        </div>
      )}

      {/* ── Consultations List ──────────────────────────────────────────────── */}
      {!consultationsLoading &&
        !consultationsError &&
        activeTab === "consultations" &&
        sortedConsultations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedConsultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
                onClick={() =>
                  router.push(`/medical-records/${consultation.id}`)
                }
              />
            ))}
          </div>
        )}

      {/* ── Prescriptions List ──────────────────────────────────────────────── */}
      {!prescriptionsLoading &&
        !prescriptionsError &&
        activeTab === "prescriptions" &&
        sortedPrescriptions.length > 0 && (
          <div className="space-y-3">
            {sortedPrescriptions.map((prescription) => (
              <PrescriptionRow
                key={prescription.id}
                prescription={prescription}
                consultationMap={consultationMap}
              />
            ))}
          </div>
        )}
    </div>
  )
}
