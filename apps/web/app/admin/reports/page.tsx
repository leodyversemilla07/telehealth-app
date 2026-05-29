"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  AlertCircle,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  Clock,
  FileText,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Video,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface ReportsData {
  appointmentsByStatus: Array<{ status: string; count: number }>
  appointmentsByType: Array<{ type: string; count: number }>
  usersByRole: Array<{ role: string; count: number }>
  auditLogsByAction: Array<{ action: string; count: number }>
  recentAuditLogs: Array<{
    id: string
    action: string
    actorEmail: string
    reason: string | null
    timestamp: string
  }>
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  completionRate: number
  cancellationRate: number
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
  COMPLETED: "text-blue-600 bg-blue-50 border-blue-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
}

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  CONFIRMED: CheckCircle,
  PENDING: Clock,
  COMPLETED: CalendarCheck,
  CANCELLED: CalendarX,
}

export default function AdminReportsPage() {
  const {
    data: reports,
    isPending,
    error,
  } = useQuery<ReportsData>({
    queryKey: ["admin-reports"],
    queryFn: () => apiClient.get<ReportsData>("/admin/reports"),
  })

  if (isPending) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Platform analytics and compliance overview.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Failed to load reports</h3>
            <p className="text-xs text-destructive/80">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reports) return null

  const totalUsers = reports.usersByRole.reduce((sum, r) => sum + r.count, 0)
  const totalAuditActions = reports.auditLogsByAction.reduce(
    (sum, a) => sum + a.count,
    0,
  )

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Platform analytics, appointment utilization, and compliance overview.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reports.completedAppointments} of {reports.totalAppointments}{" "}
              appointments
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancellation Rate
            </CardTitle>
            <CalendarX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.cancellationRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reports.cancelledAppointments} cancelled appointments
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reports.usersByRole.find((r) => r.role === "PATIENT")?.count ||
                0}{" "}
              patients,{" "}
              {reports.usersByRole.find((r) => r.role === "DOCTOR")?.count || 0}{" "}
              doctors
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Audit Events
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAuditActions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tracked security events
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Status */}
        <Card className="border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Appointments by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.appointmentsByStatus.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No appointment data yet.
              </p>
            )}
            {reports.appointmentsByStatus.map((s) => {
              const Icon = STATUS_ICONS[s.status] || Clock
              const pct =
                reports.totalAppointments > 0
                  ? Math.round((s.count / reports.totalAppointments) * 100)
                  : 0
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center ${STATUS_COLORS[s.status] || "bg-muted border-border"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.status}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Appointments by Type */}
        <Card className="border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-primary" />
              Appointments by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.appointmentsByType.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No appointment data yet.
              </p>
            )}
            {reports.appointmentsByType.map((t) => {
              const pct =
                reports.totalAppointments > 0
                  ? Math.round((t.count / reports.totalAppointments) * 100)
                  : 0
              return (
                <div key={t.type} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg border bg-primary/10 border-primary/20 flex items-center justify-center">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card className="border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.usersByRole.map((r) => {
              const pct =
                totalUsers > 0 ? Math.round((r.count / totalUsers) * 100) : 0
              let color = "bg-muted-foreground"
              let icon = <Users className="h-4 w-4" />
              if (r.role === "ADMIN") {
                color = "bg-amber-500"
                icon = <ShieldCheck className="h-4 w-4 text-white" />
              } else if (r.role === "DOCTOR") {
                color = "bg-emerald-500"
                icon = <UserCheck className="h-4 w-4 text-white" />
              } else {
                color = "bg-primary"
                icon = <Users className="h-4 w-4 text-primary-foreground" />
              }
              return (
                <div key={r.role} className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}
                  >
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.role}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Audit Events */}
        <Card className="border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.auditLogsByAction.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No audit events yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs text-right">Count</TableHead>
                    <TableHead className="text-xs text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.auditLogsByAction.map((a) => (
                    <TableRow key={a.action}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold"
                        >
                          {a.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {a.count}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {totalAuditActions > 0
                          ? Math.round((a.count / totalAuditActions) * 100)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Log */}
      <Card className="border border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            Recent Audit Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.recentAuditLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No events recorded.
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/15">
                <TableRow>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Actor</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">
                    Reason
                  </TableHead>
                  <TableHead className="text-xs text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.recentAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.actorEmail}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                      {log.reason || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
