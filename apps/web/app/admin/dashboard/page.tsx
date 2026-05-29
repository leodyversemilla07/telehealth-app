"use client"

import { useQuery } from "@tanstack/react-query"
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Activity,
  Calendar,
  CheckCircle2,
  FileText,
  History,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserX,
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

interface DashboardStats {
  totalUsers: number
  totalDoctors: number
  totalPatients: number
  totalAppointments: number
  pendingDoctors: number
  approvedDoctors: number
  bannedUsers: number
  recentAppointments: Array<{
    id: string
    status: string
    startTime: string
    patient: { name: string | null }
    doctor: { user: { name: string | null } }
  }>
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: () => apiClient.get("/admin/dashboard"),
  })

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-sm">
            Platform overview and key metrics.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Users
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats?.totalUsers ?? 0}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Doctors
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats?.totalDoctors ?? 0}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Patients
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats?.totalPatients ?? 0}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Activity className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Appointments
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats?.totalAppointments ?? 0}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pending Approval
              </span>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {stats?.pendingDoctors ?? 0}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Approved Doctors
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats?.approvedDoctors ?? 0}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 md:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Banned Users
              </span>
              <p className="text-3xl font-extrabold text-destructive">
                {stats?.bannedUsers ?? 0}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <UserX className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-primary/30 hover:bg-primary/5"
          render={<Link href="/admin/users" />}
        >
          <Users className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">Manage Users</span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5"
          render={<Link href="/admin/doctors" />}
        >
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span className="text-xs font-medium">Manage Doctors</span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5"
          render={<Link href="/admin/reports" />}
        >
          <FileText className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-medium">View Reports</span>
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-1.5 border-border/50 hover:border-violet-500/30 hover:bg-violet-500/5"
          render={<Link href="/admin/audit-logs" />}
        >
          <History className="h-5 w-5 text-violet-500" />
          <span className="text-xs font-medium">Audit Logs</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Appointments
          </CardTitle>
          <CardDescription className="text-xs">
            Latest platform activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!stats?.recentAppointments?.length ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Calendar className="h-4 w-4" />
                </EmptyMedia>
                <EmptyTitle className="text-xs">No appointments yet</EmptyTitle>
                <EmptyDescription className="text-xs">
                  Appointments will appear here once patients start booking.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y divide-border/20">
              {stats.recentAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {appt.patient?.name?.[0] || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">
                        {appt.patient?.name || "Anonymous"} →{" "}
                        {appt.doctor?.user?.name || "Doctor"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appt.startTime).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            timeZone: "Asia/Manila",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      appt.status === "COMPLETED"
                        ? "secondary"
                        : appt.status === "CANCELLED"
                          ? "destructive"
                          : "outline"
                    }
                    className="text-xs font-bold uppercase"
                  >
                    {appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
