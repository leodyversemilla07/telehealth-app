"use client"

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
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Phone,
  Play,
  Users,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  useMyAppointments,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments"

export function DoctorConsultationsClient() {
  const router = useRouter()
  const [filter, setFilter] = useState<
    "ALL" | "UPCOMING" | "IN_PROGRESS" | "COMPLETED"
  >("ALL")

  // 1. Fetch appointments assigned to the logged-in doctor
  const {
    data: appointments = [],
    isPending,
    error,
    refetch,
  } = useMyAppointments()

  // 2. Status update mutation
  const updateStatusMutation = useUpdateAppointmentStatus()

  // Handle confirming appointment (BOOKED -> CONFIRMED)
  const handleConfirm = (id: string) => {
    toast.loading("Confirming appointment...", { id: "confirm-appt" })

    updateStatusMutation.mutate(
      { id, status: "CONFIRMED" },
      {
        onSuccess: () => {
          toast.success("Appointment confirmed successfully!", {
            id: "confirm-appt",
          })
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to confirm appointment", {
            id: "confirm-appt",
          })
        },
      },
    )
  }

  // Handle starting appointment (CONFIRMED -> IN_PROGRESS)
  const handleStartConsult = (id: string) => {
    toast.loading("Starting consultation...", { id: "start-appt" })

    updateStatusMutation.mutate(
      { id, status: "IN_PROGRESS" },
      {
        onSuccess: () => {
          toast.success("Consultation started!", { id: "start-appt" })
          router.push(`/doctor/consultations/${id}`)
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to start consultation", {
            id: "start-appt",
          })
        },
      },
    )
  }

  // Status Badge Helper
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
          <Badge
            variant="secondary"
            className="text-xs font-bold uppercase bg-muted/60"
          >
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

  // Visit Type Helper
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
        return "Video Call"
      case "PHONE":
        return "Phone Consult"
      default:
        return "In-Clinic"
    }
  }

  // Localized Philippine Time Formatter
  const formatDateTime = (input: string | Date) => {
    const date = typeof input === "string" ? new Date(input) : input
    const dateStr = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    })
    const timeStr = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    })
    return { dateStr, timeStr }
  }

  // Calculated Stats
  const totalConsults = appointments.length
  const activeConsults = appointments.filter(
    (a) => a.status === "IN_PROGRESS",
  ).length
  const confirmedConsults = appointments.filter(
    (a) => a.status === "CONFIRMED",
  ).length
  const bookedConsults = appointments.filter(
    (a) => a.status === "BOOKED",
  ).length
  const upcomingConsults = confirmedConsults + bookedConsults
  const completedConsults = appointments.filter(
    (a) => a.status === "COMPLETED",
  ).length

  // Filtering Logic
  const filteredAppointments = appointments.filter((appt) => {
    if (filter === "UPCOMING")
      return appt.status === "BOOKED" || appt.status === "CONFIRMED"
    if (filter === "IN_PROGRESS") return appt.status === "IN_PROGRESS"
    if (filter === "COMPLETED") return appt.status === "COMPLETED"
    return true // ALL
  })

  // Sort: IN_PROGRESS first, then CONFIRMED, then BOOKED, then chronological by startTime
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      IN_PROGRESS: 0,
      CONFIRMED: 1,
      BOOKED: 2,
      COMPLETED: 3,
      CANCELLED: 4,
    }
    const orderA = statusOrder[a.status] ?? 99
    const orderB = statusOrder[b.status] ?? 99

    if (orderA !== orderB) {
      return orderA - orderB
    }

    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  })

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-primary" />
          Consultations Queue
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage upcoming appointments, launch virtual consultations, and review
          patient charts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/40 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Today's Queue
              </span>
              <p className="text-2xl font-black text-foreground">
                {upcomingConsults}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                In Consultation
              </span>
              <p className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
                {activeConsults}
                {activeConsults > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Video className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Completed today
              </span>
              <p className="text-2xl font-black text-emerald-600">
                {completedConsults}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Total Logs
              </span>
              <p className="text-2xl font-black text-foreground">
                {totalConsults}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main List and Tabs */}
      <Card className="border border-border/40 bg-card shadow-sm">
        <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Patient Consultations
            </CardTitle>
            <CardDescription className="text-xs">
              State-machine controlled scheduler linked directly with video
              rooms and pharmacy scripts.
            </CardDescription>
          </div>

          {/* Filtering switcher */}
          <div className="flex bg-muted/20 border border-border/10 rounded-lg p-1 text-xs shrink-0 self-start md:self-auto font-semibold">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filter === "ALL"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("UPCOMING")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filter === "UPCOMING"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Scheduled ({upcomingConsults})
            </button>
            <button
              type="button"
              onClick={() => setFilter("IN_PROGRESS")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filter === "IN_PROGRESS"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              In Call ({activeConsults})
            </button>
            <button
              type="button"
              onClick={() => setFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filter === "COMPLETED"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Completed ({completedConsults})
            </button>
          </div>
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {/* Loading */}
          {isPending && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-semibold animate-pulse">
                Retrieving clinical queue records...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="m-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-5 flex items-start gap-3 text-xs leading-normal">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold">Failed to load clinical queue</h4>
                <p>
                  {error.message || "An unexpected network blockage occurred."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="h-8 border-destructive/20 hover:bg-destructive/10 mt-2 font-semibold"
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isPending && !error && sortedAppointments.length === 0 && (
            <div className="text-center py-16 px-4 space-y-3.5">
              <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center mx-auto text-muted-foreground/60">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1 text-xs">
                <h4 className="font-bold text-foreground">
                  No matching consultations found
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Your queue is currently clear for the selected category. When
                  patients book appointments, they will manifest here.
                </p>
              </div>
            </div>
          )}

          {/* Grid list of consultations */}
          {!isPending && !error && sortedAppointments.length > 0 && (
            <div className="border border-border/10 rounded-xl overflow-hidden divide-y divide-border/10 bg-muted/5">
              {/* Table header hidden on mobile */}
              <div className="hidden md:grid grid-cols-6 gap-4 p-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-muted/15 border-b border-border/10">
                <span className="col-span-2">Patient</span>
                <span>Scheduled Time</span>
                <span>Type</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {sortedAppointments.map((appt) => {
                const { dateStr, timeStr } = formatDateTime(appt.startTime)
                const isJoinable =
                  appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS"

                return (
                  <div
                    key={appt.id}
                    className={`grid grid-cols-1 md:grid-cols-6 items-center gap-4 p-4.5 transition-all text-xs ${
                      appt.status === "IN_PROGRESS"
                        ? "bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500 pl-3.5"
                        : "hover:bg-muted/10"
                    }`}
                  >
                    {/* Patient detail */}
                    <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
                        {appt.patient?.name?.[0] ||
                          appt.patient?.email?.[0] ||
                          "P"}
                      </div>
                      <div className="space-y-0.5 text-left truncate">
                        <h4 className="font-bold text-foreground text-sm truncate">
                          {appt.patient?.name || "Anonymous Patient"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {appt.patient?.email}
                        </p>
                      </div>
                    </div>

                    {/* Scheduled Time */}
                    <div className="space-y-1 md:space-y-0.5 text-left">
                      <span className="inline-block md:hidden text-[10px] font-bold text-muted-foreground uppercase mr-2">
                        Time:
                      </span>
                      <p className="font-semibold text-foreground inline md:block">
                        {dateStr}
                      </p>
                      <p className="text-[10px] text-muted-foreground md:block font-medium md:mt-0.5">
                        <Clock className="h-3 w-3 inline text-primary mr-1" />
                        {timeStr}
                      </p>
                    </div>

                    {/* Visit Type */}
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block md:hidden text-[10px] font-bold text-muted-foreground uppercase mr-2">
                        Type:
                      </span>
                      {getVisitTypeIcon(appt.type)}
                      <span className="font-medium text-foreground">
                        {formatVisitTypeLabel(appt.type)}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center">
                      <span className="inline-block md:hidden text-[10px] font-bold text-muted-foreground uppercase mr-2">
                        Status:
                      </span>
                      {getStatusBadge(appt.status)}
                    </div>

                    {/* Dynamic Action Buttons */}
                    <div className="flex justify-end gap-2 items-center flex-wrap md:flex-nowrap">
                      {/* Confirm (BOOKED -> CONFIRMED) */}
                      {appt.status === "BOOKED" && (
                        <Button
                          size="sm"
                          className="h-8 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleConfirm(appt.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Confirm
                        </Button>
                      )}

                      {/* Start Consultation (CONFIRMED -> IN_PROGRESS) */}
                      {appt.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          className="h-8 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => handleStartConsult(appt.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Play className="h-3 w-3 mr-1 shrink-0" />
                          Start Consult
                        </Button>
                      )}

                      {/* Join Virtual Call (IN_PROGRESS or CONFIRMED) */}
                      {isJoinable && (
                        <Button
                          nativeButton={false}
                          render={
                            <Link href={`/doctor/consultations/${appt.id}`} />
                          }
                          size="sm"
                          variant={
                            appt.status === "IN_PROGRESS"
                              ? "default"
                              : "outline"
                          }
                          className={`h-8 text-[11px] font-bold shadow-xs ${
                            appt.status === "IN_PROGRESS"
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "border-border/60 text-foreground"
                          }`}
                        >
                          Join Call
                          <ChevronRight className="h-3.5 w-3.5 ml-1 shrink-0" />
                        </Button>
                      )}

                      {/* View details / Chart logs (COMPLETED) */}
                      {appt.status === "COMPLETED" && (
                        <Button
                          nativeButton={false}
                          render={
                            <Link href={`/doctor/consultations/${appt.id}`} />
                          }
                          size="sm"
                          variant="ghost"
                          className="h-8 text-[11px] text-muted-foreground hover:text-foreground font-semibold flex items-center"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Chart
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
