"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { DateRangePicker } from "@workspace/ui/components/date-range-picker"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  CalendarCheck,
  CalendarX,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Video,
} from "lucide-react"
import { useState } from "react"
import { ErrorAlert } from "@/components/error-alert"
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
  CONFIRMED: "text-success bg-success/10 border-success/30",
  PENDING: "text-warning bg-warning/10 border-warning/30",
  COMPLETED: "text-info bg-info/10 border-info/30",
  CANCELLED: "text-destructive bg-destructive/10 border-destructive/30",
}

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  CONFIRMED: CheckCircle,
  PENDING: Clock,
  COMPLETED: CalendarCheck,
  CANCELLED: CalendarX,
}

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({})

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
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Reports
            </CardTitle>
            <CardDescription className="text-sm">
              Platform analytics and compliance overview.
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
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
        <ErrorAlert
          title="Failed to load reports"
          description={error.message}
        />
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
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Reports
            </CardTitle>
            <CardDescription className="text-sm">
              Platform analytics, appointment utilization, and compliance
              overview.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="w-72">
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onChange={setDateRange}
                placeholder="Filter audit events by date"
              />
            </div>
            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => setDateRange({})}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.auditLogsByAction.map((a) => (
                    <TableRow key={a.action}>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {a.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {a.count}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            Recent Audit Events
            {(dateRange.from || dateRange.to) && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (filtered)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            const filteredLogs = reports.recentAuditLogs.filter((log) => {
              const logDate = new Date(log.timestamp)
              const matchesFrom = dateRange.from
                ? logDate >= new Date(dateRange.from)
                : true
              const matchesTo = dateRange.to
                ? logDate <= new Date(`${dateRange.to}T23:59:59`)
                : true
              return matchesFrom && matchesTo
            })
            if (filteredLogs.length === 0) {
              return (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {dateRange.from || dateRange.to
                    ? "No events in the selected date range."
                    : "No events recorded."}
                </p>
              )
            }
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Reason
                    </TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.actorEmail}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                        {log.reason || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground text-right whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
