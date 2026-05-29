"use client"

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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  Clock,
  Eye,
  MapPin,
  Phone,
  Trash2,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  useCancelAppointment,
  useMyAppointments,
} from "@/hooks/use-appointments"

export default function PatientAppointmentsPage() {
  const router = useRouter()

  // 1. Fetch patient appointments (Consumes hydrated server cache instantly)
  const { data: appointments = [], isPending, error } = useMyAppointments()

  // 2. Cancel appointment mutation
  const cancelMutation = useCancelAppointment()

  // Handle appointment cancellation
  const handleCancel = (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    toast.loading("Cancelling appointment...", { id: "cancel-appt" })

    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Appointment successfully cancelled", {
          id: "cancel-appt",
        })
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to cancel appointment", {
          id: "cancel-appt",
        })
      },
    })
  }

  // Get status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
        return (
          <Badge
            variant="outline"
            className="text-xs text-sky-600 border-sky-200 bg-sky-50/50 font-bold uppercase"
          >
            Booked
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge
            variant="outline"
            className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50/50 font-bold uppercase"
          >
            Confirmed
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase animate-pulse">
            In Progress
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="secondary" className="text-xs font-bold uppercase">
            Completed
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="text-xs font-bold uppercase">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get visit type icon helper
  const getVisitTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-3.5 w-3.5 text-primary" />
      case "PHONE":
        return <Phone className="h-3.5 w-3.5 text-sky-500" />
      default:
        return <MapPin className="h-3.5 w-3.5 text-emerald-500" />
    }
  }

  const formatVisitTypeLabel = (type: string) => {
    switch (type) {
      case "VIDEO":
        return "Video Consultation"
      case "PHONE":
        return "Phone Call Consultation"
      default:
        return "In-Clinic / In-Person"
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              My Appointments
            </CardTitle>
            <CardDescription className="text-sm">
              View and coordinate your upcoming and completed consultations.
            </CardDescription>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/patient/appointments/book" />}
            className="sm:w-fit font-semibold shadow-xs"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book Consultation
          </Button>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isPending && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <Card
              key={idx}
              className="animate-pulse bg-card/60 border border-border/40"
            >
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">
              Failed to retrieve appointments
            </h3>
            <p className="text-xs text-destructive/80 leading-relaxed">
              {error.message ||
                "An unexpected error occurred while communicating with the telehealth backend."}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isPending && !error && appointments.length === 0 && (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Calendar className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No appointments scheduled</EmptyTitle>
            <EmptyDescription>
              You do not have any upcoming or completed healthcare bookings
              registered. Book a slot with our approved specialists.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              nativeButton={false}
              render={<Link href="/patient/appointments/book" />}
              size="sm"
              className="font-medium shadow-xs"
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Book now
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {/* Appointments List Grid */}
      {!isPending && !error && appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => {
            const dateStr = new Date(appt.startTime).toLocaleDateString(
              undefined,
              {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "Asia/Manila",
              },
            )

            const timeStr = new Date(appt.startTime).toLocaleTimeString(
              undefined,
              {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
              },
            )

            const isCancellable =
              appt.status === "BOOKED" || appt.status === "CONFIRMED"
            const isJoinable =
              appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS"

            return (
              <Card
                key={appt.id}
                className="hover:shadow-md transition-all"
              >
                <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground">
                        {appt.doctor.user.name || "Doctor Specialist"}
                      </h3>
                      {getStatusBadge(appt.status)}
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase font-bold py-0"
                      >
                        {appt.doctor.specialty}
                      </Badge>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="flex items-center gap-1">
                        {getVisitTypeIcon(appt.type)}
                        {formatVisitTypeLabel(appt.type)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border/25 rounded-xl px-4 py-2 text-xs flex flex-col gap-1 items-start sm:items-end w-fit shrink-0">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {dateStr}
                    </span>
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {timeStr}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground uppercase">
                        PHT
                      </span>
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="space-y-1 text-left text-xs bg-muted/15 border border-border/10 rounded-xl p-3.5">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                      Reason for Visit:
                    </span>
                    <p className="text-foreground leading-relaxed text-sm">
                      {appt.reason || "No consultation summary provided."}
                    </p>
                    {appt.symptoms && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/15">
                        <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Symptoms:
                        </span>
                        <p className="text-foreground leading-relaxed text-xs italic mt-0.5">
                          &ldquo;{appt.symptoms}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/15 border-t border-border/20 py-3.5 px-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="text-xs text-muted-foreground">
                    Appointment ID:{" "}
                    <span className="font-mono text-[11px] select-all font-semibold">
                      {appt.id}
                    </span>
                  </div>

                  <div className="flex gap-2.5 self-end sm:self-auto">
                    {/* Cancel action */}
                    {isCancellable && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 border-border/60 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                        disabled={cancelMutation.isPending}
                        onClick={() => handleCancel(appt.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    )}

                    {/* View Details details */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-border/60"
                      onClick={() =>
                        router.push(`/patient/appointments/${appt.id}`)
                      }
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View Details
                    </Button>

                    {/* Active consultation Live Video join */}
                    {isJoinable && (
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-sm"
                        onClick={() =>
                          router.push(`/patient/appointments/${appt.id}`)
                        }
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join Video Call
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
