"use client"

import { useQuery } from "@tanstack/react-query"
import { formatPHTFull } from "@workspace/shared"
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Calendar,
  CalendarPlus,
  ChevronRight,
  Clock,
  FileText,
  MessageSquare,
  Pill,
  Stethoscope,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMyAppointments } from "@/hooks/use-appointments"
import { usePatientPrescriptions, usePatientRecords } from "@/hooks/use-records"
import { apiClient } from "@/lib/api-client"

export default function PatientDashboardPage() {
  const router = useRouter()

  const { data: profile, isLoading: profileLoading } = useQuery<{
    user: { name: string | null }
  }>({
    queryKey: ["patient-profile"],
    queryFn: () => apiClient.get("/patients/me"),
  })

  const { data: appointments = [], isPending: apptsLoading } =
    useMyAppointments()
  const { data: records = [], isLoading: recordsLoading } = usePatientRecords()
  const { data: prescriptions = [], isLoading: rxLoading } =
    usePatientPrescriptions()

  const isLoading =
    profileLoading || apptsLoading || recordsLoading || rxLoading

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const upcoming = appointments.filter(
    (a) => a.status === "BOOKED" || a.status === "CONFIRMED",
  )
  const nextAppointment = upcoming[0]
  const completedCount = appointments.filter(
    (a) => a.status === "COMPLETED",
  ).length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
        return (
          <Badge className="text-xs bg-info text-info-foreground font-bold uppercase">
            Booked
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge className="text-xs bg-success text-success-foreground font-bold uppercase">
            Confirmed
          </Badge>
        )
      case "IN_PROGRESS":
        return (
          <Badge className="text-xs bg-warning text-warning-foreground font-bold uppercase animate-pulse">
            In Progress
          </Badge>
        )
      default:
        return null
    }
  }

  const getVisitTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-3.5 w-3.5" />
      case "PHONE":
        return <PhoneIcon className="h-3.5 w-3.5" />
      default:
        return <MapPinIcon className="h-3.5 w-3.5" />
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Welcome Header */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {profile?.user?.name || "Patient"}!
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Here&apos;s your health overview for today.
            </CardDescription>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/patient/appointments/book" />}
            className="sm:w-fit font-semibold shadow-xs"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </CardHeader>
      </Card>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Upcoming
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {upcoming.length}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Completed
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {completedCount}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileText className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Records
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {records.length}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <ClipboardIcon className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prescriptions
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {prescriptions.length}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Pill className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment Highlight */}
      {nextAppointment ? (
        <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Next Appointment
                </CardTitle>
              </div>
              {getStatusBadge(nextAppointment.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Avatar size="lg" className="border border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase">
                    {nextAppointment.doctor.user.name?.[0] || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground">
                    {nextAppointment.doctor.user.name || "Doctor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextAppointment.doctor.specialty}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(nextAppointment.startTime).toLocaleDateString(
                        undefined,
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          timeZone: "Asia/Manila",
                        },
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(nextAppointment.startTime).toLocaleTimeString(
                        undefined,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                          timeZone: "Asia/Manila",
                        },
                      )}{" "}
                      PHT
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-border/60"
                  onClick={() =>
                    router.push(`/patient/appointments/${nextAppointment.id}`)
                  }
                >
                  View Details
                </Button>
                {(nextAppointment.status === "CONFIRMED" ||
                  nextAppointment.status === "IN_PROGRESS") && (
                  <Button
                    size="sm"
                    className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={() =>
                      router.push(`/patient/appointments/${nextAppointment.id}`)
                    }
                  >
                    <Video className="h-3.5 w-3.5 mr-1" />
                    Join Call
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-primary/30 hover:bg-primary/5"
          render={<Link href="/patient/appointments/book" />}
        >
          <CalendarPlus className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Book Appointment</span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
          render={<Link href="/patient/records" />}
        >
          <FileText className="h-5 w-5 text-emerald-500" />
          <span className="text-xs font-medium">Medical Records</span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-violet-500/30 hover:bg-violet-500/5"
          render={<Link href="/patient/chat" />}
        >
          <MessageSquare className="h-5 w-5 text-violet-500" />
          <span className="text-xs font-medium">Messages</span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5"
          render={<Link href="/patient/prescriptions" />}
        >
          <Pill className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-medium">Prescriptions</span>
        </Button>
      </div>

      {/* Recent Consultations */}
      <Card className="border-border/70">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Recent Consultations
            </CardTitle>
            <CardDescription className="text-xs">
              Your medical records and treatment plans from past visits
            </CardDescription>
          </div>
          <Button
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-primary hover:bg-muted font-bold"
            render={<Link href="/patient/records" />}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Stethoscope className="h-4 w-4" />
                </EmptyMedia>
                <EmptyTitle className="text-sm">
                  No consultations recorded
                </EmptyTitle>
                <EmptyDescription className="text-xs">
                  You haven&apos;t completed any consultations yet. Schedule one
                  to receive diagnostic reports.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  nativeButton={false}
                  className="text-xs h-8 font-semibold"
                  render={<Link href="/patient/appointments/book" />}
                >
                  Book Consultation
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y divide-border/20">
              {records.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="py-3 flex items-start justify-between gap-4 group hover:bg-muted/10 transition-colors rounded-lg px-2 -mx-2 cursor-pointer"
                  onClick={() =>
                    router.push(`/patient/records/consultations/${record.id}`)
                  }
                >
                  <div className="flex gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-foreground">
                        {record.appointment.doctor.user.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {record.appointment.doctor.specialty} &bull;{" "}
                        {formatPHTFull(record.appointment.startTime)}
                      </p>
                      {record.diagnosis && (
                        <p className="text-xs text-foreground/80 line-clamp-1 font-medium bg-muted/20 border border-border/10 rounded px-1.5 py-0.5 mt-1 inline-block">
                          Diagnosis: {record.diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PhoneIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MapPinIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ClipboardIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}
