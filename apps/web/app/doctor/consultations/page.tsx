"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  MapPin,
  Phone,
  Play,
  Users,
  Video,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  useCancelAppointment,
  useMyAppointments,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments"
import { ErrorAlert } from "@/components/error-alert"

export default function DoctorConsultationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<
    "ALL" | "UPCOMING" | "IN_PROGRESS" | "COMPLETED"
  >("ALL")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<{
    id: string
    patientName: string
  } | null>(null)

  const {
    data: appointments = [],
    isPending,
    error,
    refetch,
  } = useMyAppointments()

  const updateStatusMutation = useUpdateAppointmentStatus()
  const cancelMutation = useCancelAppointment()

  const openCancelDialog = (id: string, patientName: string) => {
    setAppointmentToCancel({ id, patientName })
    setCancelDialogOpen(true)
  }

  const handleCancel = () => {
    if (!appointmentToCancel) return

    setCancelDialogOpen(false)
    toast.loading("Cancelling consultation...", { id: "cancel-appt" })

    cancelMutation.mutate(appointmentToCancel.id, {
      onSuccess: () => {
        toast.success("Consultation successfully cancelled", {
          id: "cancel-appt",
        })
        setAppointmentToCancel(null)
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to cancel consultation", {
          id: "cancel-appt",
        })
      },
    })
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
        return (
          <Badge
            variant="outline"
            className="text-xs font-bold uppercase"
          >
            Booked
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge
            variant="outline"
            className="text-xs font-bold uppercase border-primary/30 text-primary bg-primary/10"
          >
            Confirmed
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge className="text-xs font-bold uppercase animate-pulse bg-warning text-warning-foreground">
            In Progress
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge
            variant="secondary"
            className="text-xs font-bold uppercase"
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

  const getVisitTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-3.5 w-3.5 text-primary" />
      case "PHONE":
        return <Phone className="h-3.5 w-3.5 text-info" />
      default:
        return <MapPin className="h-3.5 w-3.5 text-success" />
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

  const filteredAppointments = appointments.filter((appt) => {
    if (filter === "UPCOMING")
      return appt.status === "BOOKED" || appt.status === "CONFIRMED"
    if (filter === "IN_PROGRESS") return appt.status === "IN_PROGRESS"
    if (filter === "COMPLETED") return appt.status === "COMPLETED"
    return true
  })

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
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Title */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Consultations Queue
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Manage upcoming appointments, launch virtual consultations, and review
              patient charts.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                Today&apos;s Queue
              </span>
              <p className="text-2xl font-bold text-foreground">
                {upcomingConsults}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                In Consultation
              </span>
              <p className="text-2xl font-bold text-warning flex items-center gap-1.5">
                {activeConsults}
                {activeConsults > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning"></span>
                  </span>
                )}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <Video className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                Completed today
              </span>
              <p className="text-2xl font-bold text-success">
                {completedConsults}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                Total Logs
              </span>
              <p className="text-2xl font-bold text-foreground">
                {totalConsults}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
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

          {/* Filter Tabs */}
          <div className="flex bg-muted/20 border border-border/10 rounded-lg p-1 text-xs shrink-0 self-start md:self-auto font-semibold gap-1">
            <Button
              type="button"
              variant={filter === "ALL" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("ALL")}
              className={`h-7 px-3 text-xs ${
                filter === "ALL"
                  ? "font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </Button>
            <Button
              type="button"
              variant={filter === "UPCOMING" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("UPCOMING")}
              className={`h-7 px-3 text-xs ${
                filter === "UPCOMING"
                  ? "font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Scheduled ({upcomingConsults})
            </Button>
            <Button
              type="button"
              variant={filter === "IN_PROGRESS" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("IN_PROGRESS")}
              className={`h-7 px-3 text-xs ${
                filter === "IN_PROGRESS"
                  ? "font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              In Call ({activeConsults})
            </Button>
            <Button
              type="button"
              variant={filter === "COMPLETED" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("COMPLETED")}
              className={`h-7 px-3 text-xs ${
                filter === "COMPLETED"
                  ? "font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Completed ({completedConsults})
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading */}
          {isPending && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Spinner className="h-10 w-10 text-primary" />
              <p className="text-xs text-muted-foreground font-semibold animate-pulse">
                Retrieving clinical queue records...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <ErrorAlert
              title="Failed to load clinical queue"
              description={
                error.message || "An unexpected network blockage occurred."
              }
              actionLabel="Retry Connection"
              onAction={() => refetch()}
            />
          )}

          {/* Empty state */}
          {!isPending && !error && sortedAppointments.length === 0 && (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Calendar className="h-4 w-4" />
                </EmptyMedia>
                <EmptyTitle>No matching consultations found</EmptyTitle>
                <EmptyDescription>
                  Your queue is currently clear for the selected category. When
                  patients book appointments, they will manifest here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {/* Table */}
          {!isPending && !error && sortedAppointments.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Scheduled Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAppointments.map((appt) => {
                  const { dateStr, timeStr } = formatDateTime(appt.startTime)
                  const isJoinable = appt.status === "IN_PROGRESS"

                  return (
                    <TableRow
                      key={appt.id}
                      className={appt.status === "IN_PROGRESS" ? "bg-warning/5" : ""}
                    >
                      {/* Patient */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" className="border border-primary/20 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase text-xs">
                              {appt.patient?.name?.[0] ||
                                appt.patient?.email?.[0] ||
                                "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 text-left truncate">
                            <h4 className="font-medium text-foreground text-sm truncate">
                              {appt.patient?.name || "Anonymous Patient"}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {appt.patient?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Scheduled Time */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground text-sm">
                            {dateStr}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline text-muted-foreground mr-1" />
                            {timeStr}
                          </p>
                        </div>
                      </TableCell>

                      {/* Visit Type */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getVisitTypeIcon(appt.type)}
                          <span className="font-medium text-foreground text-sm">
                            {formatVisitTypeLabel(appt.type)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {getStatusBadge(appt.status)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {/* Cancel */}
                          {(appt.status === "BOOKED" ||
                            appt.status === "CONFIRMED" ||
                            appt.status === "IN_PROGRESS") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                              disabled={
                                cancelMutation.isPending ||
                                updateStatusMutation.isPending
                              }
                              onClick={() =>
                                openCancelDialog(
                                  appt.id,
                                  appt.patient?.name || "this patient",
                                )
                              }
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                          )}

                          {/* Confirm */}
                          {appt.status === "BOOKED" && (
                            <Button
                              size="sm"
                              className="h-8 text-xs font-semibold bg-success hover:bg-success/90 text-success-foreground"
                              onClick={() => handleConfirm(appt.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Confirm
                            </Button>
                          )}

                          {/* Start Consult */}
                          {appt.status === "CONFIRMED" && (
                            <Button
                              size="sm"
                              className="h-8 text-xs font-semibold bg-warning hover:bg-warning/90 text-warning-foreground"
                              onClick={() => handleStartConsult(appt.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Play className="h-3 w-3 mr-1 shrink-0" />
                              Start Consult
                            </Button>
                          )}

                          {/* Join Call */}
                          {isJoinable && (
                            <Button
                              nativeButton={false}
                              render={
                                <Link
                                  href={`/doctor/consultations/${appt.id}`}
                                />
                              }
                              size="sm"
                              variant="default"
                              className="h-8 text-xs font-bold shadow-xs"
                            >
                              Join Call
                            </Button>
                          )}

                          {/* View Chart */}
                          {appt.status === "COMPLETED" && (
                            <Button
                              nativeButton={false}
                              render={
                                <Link
                                  href={`/doctor/consultations/${appt.id}`}
                                />
                              }
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-muted-foreground hover:text-foreground font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View Chart
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Consultation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the consultation with{" "}
              <span className="font-semibold text-foreground">
                {appointmentToCancel?.patientName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Keep Consultation
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Cancelling...
                </>
              ) : (
                "Cancel Consultation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
