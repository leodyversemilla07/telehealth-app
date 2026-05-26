"use client"

import type { AppointmentDto, AppointmentStatus, VisitType } from "@workspace/shared"
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
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Loader2,
  Monitor,
  Phone,
  Stethoscope,
  Plus,
  XCircle,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import {
  useCancelAppointment,
  useMyAppointments,
} from "@/hooks/use-appointments"

// ── Status helpers ────────────────────────────────────────────────────────────

type FilterTab = "upcoming" | "past" | "cancelled"

const STATUS_BADGE_MAP: Record<
  AppointmentStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }
> = {
  BOOKED: {
    label: "Booked",
    variant: "default",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25 hover:bg-blue-500/20",
  },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "default",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/20",
  },
  COMPLETED: {
    label: "Completed",
    variant: "secondary",
    className: "bg-muted text-muted-foreground border-muted-foreground/25",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
    className: "bg-destructive/15 text-destructive border-destructive/25 hover:bg-destructive/20",
  },
}

const UPCOMING_STATUSES: AppointmentStatus[] = ["BOOKED", "CONFIRMED", "IN_PROGRESS"]
const PAST_STATUSES: AppointmentStatus[] = ["COMPLETED"]
const CANCELLED_STATUSES: AppointmentStatus[] = ["CANCELLED"]

const CANCELLABLE_STATUSES: AppointmentStatus[] = ["BOOKED", "CONFIRMED"]

function filterByTab(appointments: AppointmentDto[], tab: FilterTab): AppointmentDto[] {
  switch (tab) {
    case "upcoming":
      return appointments.filter((a) => UPCOMING_STATUSES.includes(a.status))
    case "past":
      return appointments.filter((a) => PAST_STATUSES.includes(a.status))
    case "cancelled":
      return appointments.filter((a) => CANCELLED_STATUSES.includes(a.status))
  }
}

// ── Visit type icon ───────────────────────────────────────────────────────────

function VisitTypeIcon({ type }: { type: VisitType }) {
  switch (type) {
    case "VIDEO":
      return <Video className="h-3.5 w-3.5" />
    case "PHONE":
      return <Phone className="h-3.5 w-3.5" />
    case "IN_PERSON":
      return <Monitor className="h-3.5 w-3.5" />
  }
}

function visitTypeLabel(type: VisitType) {
  switch (type) {
    case "VIDEO":
      return "Video Call"
    case "PHONE":
      return "Phone Call"
    case "IN_PERSON":
      return "In Person"
  }
}

// ── Date formatting ───────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "full",
})

const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  timeStyle: "short",
  hour12: true,
})

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AppointmentCardSkeleton() {
  return (
    <Card className="animate-pulse bg-card/60 border-border/40">
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="h-5 w-20 bg-muted rounded-full" />
      </CardHeader>
      <CardContent className="space-y-3 py-2">
        <div className="h-3 w-40 bg-muted rounded" />
        <div className="h-3 w-28 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
      </CardContent>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { data: appointments, isPending, error } = useMyAppointments()
  const cancelMutation = useCancelAppointment()
  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming")

  // Derive role from session
  const user = session?.user as
    | { name?: string | null; email: string; role?: string | null }
    | undefined
  const role = user?.role ?? "PATIENT"
  const isPatient = role === "PATIENT"

  // Filtered list
  const filtered = appointments ? filterByTab(appointments, activeTab) : []

  // Sort: most recent startTime first for upcoming, most recent first for past/cancelled
  const sorted = [...filtered].sort((a, b) => {
    if (activeTab === "upcoming") {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    }
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  })

  // ── Cancel handler ──────────────────────────────────────────────────────────
  function handleCancel(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Appointment cancelled successfully.")
      },
      onError: (err: { message?: string }) => {
        toast.error(err.message || "Failed to cancel appointment.")
      },
    })
  }

  // ── Tab counts ──────────────────────────────────────────────────────────────
  const counts = {
    upcoming: appointments?.filter((a) => UPCOMING_STATUSES.includes(a.status)).length ?? 0,
    past: appointments?.filter((a) => PAST_STATUSES.includes(a.status)).length ?? 0,
    cancelled: appointments?.filter((a) => CANCELLED_STATUSES.includes(a.status)).length ?? 0,
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabs: { key: FilterTab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isPatient ? "My Appointments" : "My Schedule"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPatient
              ? "View and manage your upcoming and past appointments."
              : "View and manage appointments assigned to you."}
          </p>
        </div>

        {isPatient && (
          <Link href="/appointments/book">
            <Button className="gap-2 shadow-md shadow-primary/10 hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" />
              Book New
            </Button>
          </Link>
        )}
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-xl bg-card border border-border/40 p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton has no stable id
            <AppointmentCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Failed to load appointments</h3>
            <p className="text-xs text-destructive/80 leading-relaxed">
              {error.message ||
                "An unexpected error occurred while fetching your appointments. Please try again."}
            </p>
          </div>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {!isPending && !error && sorted.length === 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">
              No appointments yet
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeTab === "upcoming" && isPatient
                ? "You don't have any upcoming appointments. Book one now to get started."
                : activeTab === "upcoming"
                  ? "There are no upcoming appointments on your schedule."
                  : activeTab === "past"
                    ? "You don't have any past appointments."
                    : "You don't have any cancelled appointments."}
            </p>
          </div>
          {isPatient && activeTab === "upcoming" && (
          <Link href="/appointments/book">
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Book Appointment
            </Button>
          </Link>
          )}
        </div>
      )}

      {/* ── Appointment Cards ────────────────────────────────────────────────── */}
      {!isPending && !error && sorted.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((appt) => {
            const statusConfig = STATUS_BADGE_MAP[appt.status]
            const canCancel = CANCELLABLE_STATUSES.includes(appt.status)
            const displayName = isPatient
              ? appt.provider.user.name || "Provider"
              : appt.patient.name || "Patient"
            const displaySpecialty = isPatient ? appt.provider.specialty : null

            return (
              <Card
                key={appt.id}
                className="group relative overflow-hidden border border-border/40 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 bg-card transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/appointments/${appt.id}`)}
              >
                {/* Left accent band */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    appt.status === "CANCELLED"
                      ? "bg-destructive"
                      : appt.status === "COMPLETED"
                        ? "bg-muted-foreground/30"
                        : appt.status === "IN_PROGRESS"
                          ? "bg-amber-500"
                          : appt.status === "CONFIRMED"
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                  }`}
                />

                <CardHeader className="flex flex-row items-start gap-4 pb-3 pl-5">
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    {isPatient ? (
                      <Stethoscope className="h-5 w-5" />
                    ) : (
                      <CalendarDays className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <CardTitle className="truncate text-sm font-semibold text-foreground">
                      {displayName}
                    </CardTitle>
                    {displaySpecialty && (
                      <CardDescription className="text-xs truncate">
                        {displaySpecialty}
                      </CardDescription>
                    )}
                  </div>

                  <Badge
                    variant={statusConfig.variant}
                    className={`shrink-0 text-[10px] h-5 font-semibold border ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3 pl-5 pb-4">
                  {/* Date & time */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>{dateFormatter.format(new Date(appt.startTime))}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>
                      {timeFormatter.format(new Date(appt.startTime))} &ndash;{" "}
                      {timeFormatter.format(new Date(appt.endTime))}
                    </span>
                  </div>

                  {/* Visit type */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <VisitTypeIcon type={appt.type} />
                    <span>{visitTypeLabel(appt.type)}</span>
                  </div>

                  {/* Reason */}
                  {appt.reason && (
                    <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
                      {appt.reason.length > 100
                        ? `${appt.reason.slice(0, 100)}…`
                        : appt.reason}
                    </p>
                  )}

                  <Separator className="!mt-4" />

                  {/* Actions */}
                  <div className="flex items-center gap-2 !mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[11px] gap-1.5 h-8 font-medium"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/appointments/${appt.id}`)
                      }}
                    >
                      View Details
                    </Button>
                    {canCancel && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-[11px] gap-1.5 h-8 font-medium"
                        disabled={cancelMutation.isPending}
                        onClick={(e) => handleCancel(appt.id, e)}
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
