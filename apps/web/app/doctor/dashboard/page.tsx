"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MessageSquare,
  Play,
  Users,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMyAppointments } from "@/hooks/use-appointments"

export default function DoctorDashboardPage() {
  const router = useRouter()
  const { data: appointments = [], isPending } = useMyAppointments()

  const totalAppts = appointments.length
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

  const nextAppointment = appointments
    .filter((a) => a.status === "CONFIRMED" || a.status === "BOOKED")
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )[0]

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Doctor Dashboard
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Track consultations, schedules, and patient activity.
            </CardDescription>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/doctor/consultations" />}
            className="sm:w-fit font-semibold shadow-xs"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            View Queue
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
                  Scheduled
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {isPending ? "..." : upcomingConsults}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <CalendarDays className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  In Consultation
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1 flex items-center gap-2">
                  {isPending ? "..." : activeConsults}
                  {activeConsults > 0 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                  )}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Video className="h-4.5 w-4.5" />
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
                  {isPending ? "..." : completedConsults}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Logs
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {isPending ? "..." : totalAppts}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <ClipboardList className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment Highlight */}
      {nextAppointment ? (
        <Card className="border-primary/20 dark:border-primary/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider">
                Next Scheduled Consultation
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Avatar size="lg" className="border border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase text-lg">
                    {nextAppointment.patient?.name?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground">
                    {nextAppointment.patient?.name || "Anonymous Patient"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextAppointment.type === "VIDEO"
                      ? "Video Consultation"
                      : nextAppointment.type === "PHONE"
                        ? "Phone Consultation"
                        : "In-Person Visit"}
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
                {nextAppointment.status === "BOOKED" && (
                  <Button
                    size="sm"
                    className="text-xs h-8 font-semibold"
                    render={
                      <Link
                        href={`/doctor/consultations`}
                      />
                    }
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Start Consult
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-border/60"
                  render={
                    <Link
                      href={`/doctor/consultations/${nextAppointment.id}`}
                    />
                  }
                >
                  View Details
                </Button>
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
          render={<Link href="/doctor/consultations" />}
        >
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Consultation Queue</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
          nativeButton={false}
          render={<Link href="/doctor/schedule" />}
        >
          <CalendarDays className="h-5 w-5 text-emerald-500" />
          <span className="text-xs font-medium">Manage Schedule</span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-violet-500/30 hover:bg-violet-500/5"
          render={<Link href="/doctor/patients" />}
        >
          <Users className="h-5 w-5 text-violet-500" />
          <span className="text-xs font-medium">Patient List</span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5"
          render={<Link href="/doctor/records" />}
        >
          <FileText className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-medium">Medical Records</span>
        </Button>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Appointment Queue
            </CardTitle>
            <CardDescription className="text-xs">
              Review and manage today&apos;s consultations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/doctor/consultations" />}
              size="sm"
              className="text-xs h-8"
            >
              Open consultations
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              Video Consults
            </CardTitle>
            <CardDescription className="text-xs">
              Join secure live consultations directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/doctor/consultations" />}
              size="sm"
              variant="secondary"
              className="text-xs h-8"
            >
              Join a consultation
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Patient Messages
            </CardTitle>
            <CardDescription className="text-xs">
              Respond to patient inquiries and messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/doctor/chat" />}
              size="sm"
              variant="outline"
              className="text-xs h-8"
            >
              Open messages
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
