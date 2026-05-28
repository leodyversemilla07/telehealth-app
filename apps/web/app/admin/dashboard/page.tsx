"use client"

import { useQuery } from "@tanstack/react-query"
import type { AuditLogDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Activity,
  AlertCircle,
  Calendar,
  Clock,
  Crown,
  FileText,
  Search,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  Users,
  UserX,
  Video,
} from "lucide-react"
import { useState } from "react"
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
    startTime: string
    status: string
    type: string
    patient: { name: string | null }
    doctor: { user: { name: string | null } }
  }>
}

export default function AdminDashboardPage() {
  const [logSearchQuery, setLogSearchQuery] = useState("")

  // 1. Fetch Dashboard Stats
  const {
    data: stats,
    isPending: statsPending,
    error: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: () => apiClient.get<DashboardStats>("/admin/dashboard"),
  })

  // 2. Fetch Audit Logs Query
  const { data: auditLogs = [], isPending: logsPending } = useQuery<
    AuditLogDto[]
  >({
    queryKey: ["audit-logs"],
    queryFn: () => apiClient.get<AuditLogDto[]>("/audit-logs"),
  })

  const filteredLogs = auditLogs.filter((log) => {
    const term = logSearchQuery.toLowerCase()
    return (
      log.action.toLowerCase().includes(term) ||
      log.actorEmail.toLowerCase().includes(term) ||
      log.targetEmail?.toLowerCase().includes(term) ||
      log.reason?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time metrics overview, recent consultations, and security audit
          logs.
        </p>
      </div>

      {/* Primary Loading State */}
      {statsPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="animate-pulse bg-card/60">
              <CardHeader className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {statsError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">
              Failed to retrieve dashboard statistics
            </h3>
            <p className="text-xs text-destructive/80 leading-relaxed">
              {statsError.message ||
                "An unexpected error occurred while communicating with the admin backend."}
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {!statsPending && !statsError && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Users */}
          <Card className="border border-border/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Patients:{" "}
                <strong className="text-foreground">
                  {stats.totalPatients}
                </strong>{" "}
                | Providers:{" "}
                <strong className="text-foreground">
                  {stats.totalDoctors}
                </strong>
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Banned */}
          <Card className="border border-border/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Banned Users
              </CardTitle>
              <UserX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bannedUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Suspended accounts in the platform
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Providers */}
          <Card className="border border-border/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Licensed Providers
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedDoctors}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending verification:{" "}
                <strong className="text-amber-600">
                  {stats.pendingDoctors}
                </strong>
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Appointments */}
          <Card className="border border-border/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Booked Consults
              </CardTitle>
              <Video className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Virtual consultations booked
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Recent Appointments */}
        <Card className="lg:col-span-2 border border-border/40 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Consultations
            </CardTitle>
            <CardDescription className="text-xs">
              Overview of the most recently scheduled virtual and physical
              consultation bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!statsPending && !stats && (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No recent appointments found.
              </div>
            )}

            {stats && stats.recentAppointments.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No active consultation bookings recorded.
              </div>
            )}

            {stats && stats.recentAppointments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/15 text-muted-foreground font-medium text-xs">
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Scheduled Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAppointments.map((appt) => (
                      <tr
                        key={appt.id}
                        className="border-b border-border/10 hover:bg-muted/10 last:border-0"
                      >
                        <td className="py-3 px-4 font-semibold text-xs text-foreground">
                          {appt.patient.name || "Patient"}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {appt.doctor.user.name || "Doctor"}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {new Date(appt.startTime).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[9px] h-5 font-bold uppercase ${
                              appt.status === "CONFIRMED"
                                ? "text-emerald-600 border-emerald-200 bg-emerald-50/50"
                                : "text-sky-600 border-sky-200 bg-sky-50/50"
                            }`}
                          >
                            {appt.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 3: Audit Logs Activity */}
        <Card className="border border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="flex flex-col gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Audit Logs
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time security auditing tracing actions.
              </CardDescription>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-muted/20"
              />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 overflow-y-auto max-h-[360px]">
            {logsPending ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex gap-4 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-40 bg-muted rounded" />
                      <div className="h-2.5 w-full bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No matching activities logged.
              </div>
            ) : (
              <div className="relative border-l border-border pl-4 ml-2 space-y-4">
                {filteredLogs.slice(0, 10).map((log) => {
                  let icon = <FileText className="h-3 w-3" />
                  let colorClass =
                    "bg-muted text-muted-foreground border-border"
                  const action = log.action.toLowerCase()

                  if (action.includes("ban")) {
                    icon = <UserX className="h-3 w-3" />
                    colorClass =
                      "bg-destructive/10 text-destructive border-destructive/20"
                  } else if (action.includes("unban")) {
                    icon = <UserCheck className="h-3 w-3" />
                    colorClass =
                      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  } else if (action.includes("role")) {
                    icon = <Crown className="h-3 w-3" />
                    colorClass = "bg-primary/10 text-primary border-primary/20"
                  } else if (action.includes("session")) {
                    icon = <ShieldAlert className="h-3 w-3" />
                    colorClass =
                      "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }

                  return (
                    <div key={log.id} className="relative group text-left">
                      <div
                        className={`absolute -left-[27px] top-0.5 h-5 w-5 rounded-full border flex items-center justify-center shadow-xs shrink-0 ${colorClass}`}
                      >
                        {icon}
                      </div>
                      <div className="space-y-1 pl-1">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="font-semibold text-xs text-foreground">
                            {log.action}
                          </span>
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            {new Date(log.timestamp).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-normal truncate max-w-[200px]">
                          By:{" "}
                          <strong className="text-foreground">
                            {log.actorEmail}
                          </strong>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
