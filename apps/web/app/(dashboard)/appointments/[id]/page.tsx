"use client"

import type { AppointmentStatus } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Separator } from "@workspace/ui/components/separator"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Monitor,
  Phone,
  Play,
  RotateCcw,
  Stethoscope,
  Video,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import React, { useState } from "react"
import { toast } from "sonner"
import {
  useAppointment,
  useCancelAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments"
import { authClient } from "@/lib/auth-client"

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<
  AppointmentStatus,
  {
    label: string
    variant: "default" | "secondary" | "outline" | "destructive"
    className: string
  }
> = {
  BOOKED: {
    label: "Booked",
    variant: "default",
    className:
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "default",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  },
  COMPLETED: {
    label: "Completed",
    variant: "secondary",
    className: "bg-muted text-muted-foreground border-muted-foreground/25",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
    className: "bg-destructive/15 text-destructive border-destructive/25",
  },
}

function VisitTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "VIDEO":
      return <Video className="h-4 w-4" />
    case "PHONE":
      return <Phone className="h-4 w-4" />
    case "IN_PERSON":
      return <Monitor className="h-4 w-4" />
    default:
      return null
  }
}

function visitTypeLabel(type: string) {
  switch (type) {
    case "VIDEO":
      return "Video Call"
    case "PHONE":
      return "Phone Call"
    case "IN_PERSON":
      return "In Person"
    default:
      return type
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "full" })
const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  timeStyle: "short",
  hour12: true,
})

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const { data: session } = authClient.useSession()
  const { data: appointment, isPending, error } = useAppointment(id)
  const cancelMutation = useCancelAppointment()
  const statusMutation = useUpdateAppointmentStatus()
  const [cancelOpen, setCancelOpen] = useState(false)

  const user = session?.user as
    | { name?: string | null; email: string; role?: string | null }
    | undefined
  const role = user?.role ?? "PATIENT"
  const isProvider = role === "DOCTOR" || role === "ADMIN"
  const isPatient = role === "PATIENT"

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleCancel() {
    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Appointment cancelled.")
        setCancelOpen(false)
      },
      onError: (err: { message?: string }) =>
        toast.error(err.message || "Failed to cancel."),
    })
  }

  function handleStatusUpdate(status: AppointmentStatus) {
    statusMutation.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`Status updated to ${status}.`),
        onError: (err: { message?: string }) =>
          toast.error(err.message || "Failed to update status."),
      },
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading appointment details...
          </p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !appointment) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md w-full border-destructive/30">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive text-lg">
              Appointment Not Found
            </CardTitle>
            <CardDescription>
              {error?.message ||
                "This appointment may have been removed or you don't have access."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/appointments">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Appointments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const statusConfig = STATUS_BADGE_MAP[appointment.status]
  const canCancel = ["BOOKED", "CONFIRMED"].includes(appointment.status)
  const canConfirm = isProvider && appointment.status === "BOOKED"
  const canStart = isProvider && appointment.status === "CONFIRMED"
  const canComplete = isProvider && appointment.status === "IN_PROGRESS"
  const canReschedule =
    isPatient && ["BOOKED", "CONFIRMED"].includes(appointment.status)

  const displayName = isPatient
    ? appointment.doctor.user.name || "Doctor"
    : appointment.patient.name || "Patient"
  const displaySpecialty = isPatient ? appointment.doctor.specialty : null

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Back nav ──────────────────────────────────────────────────────── */}
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Appointments
      </Link>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Appointment Details
            </h1>
            <Badge
              variant={statusConfig.variant}
              className={`text-[10px] h-5 font-semibold border ${statusConfig.className}`}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {isPatient ? "Doctor" : "Patient"}: {displayName}
            {displaySpecialty && ` — ${displaySpecialty}`}
          </p>
        </div>

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <Button
              size="sm"
              className="gap-1.5"
              disabled={statusMutation.isPending}
              onClick={() => handleStatusUpdate("CONFIRMED")}
            >
              {statusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirm
            </Button>
          )}
          {canStart && (
            <Button
              size="sm"
              className="gap-1.5 bg-amber-600 hover:bg-amber-700"
              disabled={statusMutation.isPending}
              onClick={() => handleStatusUpdate("IN_PROGRESS")}
            >
              {statusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              className="gap-1.5"
              disabled={statusMutation.isPending}
              onClick={() => handleStatusUpdate("COMPLETED")}
            >
              {statusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Complete
            </Button>
          )}
          {canReschedule && (
            <Link href={`/appointments/${id}/reschedule`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RotateCcw className="h-4 w-4" />
                Reschedule
              </Button>
            </Link>
          )}
          {canCancel && (
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Cancel
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Appointment?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The appointment will be marked
                    as cancelled and the time slot will become available for
                    others.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 justify-end">
                  <DialogClose
                    render={
                      <Button variant="outline" size="sm">
                        Keep Appointment
                      </Button>
                    }
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Yes, Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Appointment info cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date & Time */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {dateFormatter.format(new Date(appointment.startTime))}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {timeFormatter.format(new Date(appointment.startTime))} &ndash;{" "}
              {timeFormatter.format(new Date(appointment.endTime))}
            </div>
          </CardContent>
        </Card>

        {/* Visit Type */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <VisitTypeIcon type={appointment.type} />
              Visit Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground">
              {visitTypeLabel(appointment.type)}
            </p>
            {appointment.roomUrl && (
              <a
                href={appointment.roomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                Join Video Room →
              </a>
            )}
          </CardContent>
        </Card>

        {/* Patient/Provider info */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              {isPatient ? (
                <Stethoscope className="h-4 w-4" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              {isPatient ? "Doctor" : "Patient"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            {displaySpecialty && (
              <p className="text-xs text-muted-foreground">
                {displaySpecialty}
              </p>
            )}
            {!isPatient && appointment.patient.email && (
              <p className="text-xs text-muted-foreground">
                {appointment.patient.email}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reason & Symptoms */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {appointment.reason && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Reason
                </p>
                <p className="text-sm text-foreground">{appointment.reason}</p>
              </div>
            )}
            {appointment.symptoms && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Symptoms
                </p>
                <p className="text-sm text-foreground">
                  {appointment.symptoms}
                </p>
              </div>
            )}
            {!appointment.reason && !appointment.symptoms && (
              <p className="text-xs text-muted-foreground italic">
                No details provided
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Notes ─────────────────────────────────────────────────────────── */}
      {appointment.notes && (
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {appointment.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
