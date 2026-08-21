"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ErrorAlert } from "@/components/error-alert"
import { useMyAppointments } from "@/hooks/use-appointments"
import { usePatientPrescriptions, usePatientRecords } from "@/hooks/use-records"
import { toDate } from "@/lib/dates"
import { useTRPC } from "@/lib/trpc/client"

export default function PatientDashboardPage() {
  const router = useRouter()
  const trpc = useTRPC()

  const {
    data: profile,
    isPending: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    ...trpc.patients.me.queryOptions(),
    // Keep the last snapshot on screen during refetches — never blank back
    // into the skeleton once data has loaded.
    placeholderData: keepPreviousData,
  })

  const {
    data: appointmentsData,
    isPending: apptsLoading,
    error: apptsError,
    refetch: refetchAppts,
  } = useMyAppointments()
  const appointments = appointmentsData?.appointments ?? []
  const {
    data: records = [],
    isPending: recordsLoading,
    error: recordsError,
    refetch: refetchRecords,
  } = usePatientRecords()
  const {
    data: prescriptions = [],
    isPending: rxLoading,
    error: rxError,
    refetch: refetchRx,
  } = usePatientPrescriptions()

  // A failed fetch with nothing cached must not read as "all zero". Show an
  // inline banner (with retry) instead of silently rendering empty stats.
  const dataError =
    (!profile && profileError ? profileError : null) ??
    (!appointmentsData && apptsError ? apptsError : null) ??
    (records.length === 0 && recordsError ? recordsError : null) ??
    (prescriptions.length === 0 && rxError ? rxError : null)

  const retryAll = () => {
    void refetchProfile()
    void refetchAppts()
    void refetchRecords()
    void refetchRx()
  }

  const isLoading =
    (profileLoading && !profile) ||
    (apptsLoading && appointments.length === 0) ||
    (recordsLoading && records.length === 0) ||
    (rxLoading && prescriptions.length === 0)

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
          <Badge className="text-xs bg-info/10 text-info border-info font-bold uppercase">
            Booked
          </Badge>
        )
      case "CONFIRMED":
        return (
          <Badge className="text-xs bg-success/10 text-success border-success font-bold uppercase">
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

  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      {/* Data-fetch error (e.g. backend down) — not an empty dashboard */}
      {dataError && (
        <ErrorAlert
          title="Failed to load your dashboard"
          description={
            dataError instanceof Error
              ? dataError.message
              : "The telehealth service is unreachable right now. Please try again."
          }
          actionLabel="Try again"
          onAction={retryAll}
        />
      )}

      {/* Welcome Header */}
      <Card className="border-border/80 bg-card p-2 sm:p-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                Patient Portal
              </span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hello, {profile?.user?.name || "Patient"}! 👋
            </CardTitle>
            <CardDescription className="text-sm mt-1 text-muted-foreground">
              Here&apos;s your health summary, appointments, and medical
              updates.
            </CardDescription>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/patient/appointments/book" />}
            className="h-10 sm:w-fit font-semibold shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </CardHeader>
      </Card>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/70 bg-card/80 transition-all hover:border-primary/40 hover:shadow-md">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Upcoming
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {upcoming.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 transition-all hover:border-primary/40 hover:shadow-md">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Completed
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {completedCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 transition-all hover:border-primary/40 hover:shadow-md">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Records
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {records.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ClipboardIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 transition-all hover:border-primary/40 hover:shadow-md">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Prescriptions
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {prescriptions.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                <Pill className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment Highlight */}
      {nextAppointment ? (
        <Card className="border border-primary/30 bg-card overflow-hidden shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                </span>
                <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider">
                  Next Scheduled Appointment
                </CardTitle>
              </div>
              {getStatusBadge(nextAppointment.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3.5 flex-1">
                <Avatar
                  size="lg"
                  className="border-2 border-primary/20 shrink-0 shadow-sm"
                >
                  <AvatarFallback className="bg-primary/15 text-primary font-bold uppercase text-base">
                    {nextAppointment.doctor.user.name?.[0] || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground text-base">
                    {nextAppointment.doctor.user.name || "Doctor"}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {nextAppointment.doctor.specialty}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="size-3.5 text-primary" />
                      {toDate(nextAppointment, "startTime").toLocaleDateString(
                        undefined,
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          timeZone: "Asia/Manila",
                        },
                      )}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="size-3.5 text-primary" />
                      {toDate(nextAppointment, "startTime").toLocaleTimeString(
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
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  className="text-xs h-10 px-4 rounded-xl border-border/80 hover:border-primary/40 font-medium"
                  onClick={() =>
                    router.push(`/patient/appointments/${nextAppointment.id}`)
                  }
                >
                  View Details
                </Button>
                {(nextAppointment.status === "CONFIRMED" ||
                  nextAppointment.status === "IN_PROGRESS" ||
                  nextAppointment.status === "BOOKED") && (
                  <Button
                    className="text-xs h-10 px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25"
                    onClick={() =>
                      router.push(`/patient/appointments/${nextAppointment.id}`)
                    }
                  >
                    <Stethoscope className="size-4 mr-1.5" />
                    Consultation Room
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
          className="h-auto py-4.5 flex flex-col items-center gap-2 rounded-2xl border-border/70 hover:border-primary/50 hover:bg-primary/[0.06] transition-all duration-200 shadow-sm"
          render={<Link href="/patient/appointments/book" />}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarPlus className="size-5" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            Book Appointment
          </span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4.5 flex flex-col items-center gap-2 rounded-2xl border-border/70 hover:border-success/50 hover:bg-success/[0.06] transition-all duration-200 shadow-sm"
          render={<Link href="/patient/records" />}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <FileText className="size-5" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            Medical Records
          </span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4.5 flex flex-col items-center gap-2 rounded-2xl border-border/70 hover:border-info/50 hover:bg-info/[0.06] transition-all duration-200 shadow-sm"
          render={<Link href="/patient/chat" />}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-info/10 text-info">
            <MessageSquare className="size-5" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            Doctor Chat
          </span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4.5 flex flex-col items-center gap-2 rounded-2xl border-border/70 hover:border-warning/50 hover:bg-warning/[0.06] transition-all duration-200 shadow-sm"
          render={<Link href="/patient/prescriptions" />}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Pill className="size-5" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            Prescriptions
          </span>
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
            className="text-xs h-9 px-3 text-primary hover:bg-muted font-bold"
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
                  nativeButton={false}
                  className="text-xs h-9 font-semibold"
                  render={<Link href="/patient/appointments/book" />}
                >
                  Book Consultation
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y divide-border/20">
              {records.slice(0, 5).map((record) => (
                <Button
                  variant="ghost"
                  type="button"
                  key={record.id}
                  className="-mx-2 h-auto w-full cursor-pointer items-start justify-between rounded-lg px-2 py-3 text-left hover:bg-muted/10"
                  onClick={() =>
                    router.push(
                      `/patient/appointments/${record.appointment.id}`,
                    )
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
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
      <title>Clipboard</title>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}
