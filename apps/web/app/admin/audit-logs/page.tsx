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
import { Input } from "@workspace/ui/components/input"
import { DateRangePicker } from "@workspace/ui/components/date-range-picker"
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
  Clock,
  LogIn,
  LogOut,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"

interface AuditLog {
  id: string
  action: string
  actorId: string
  actorEmail: string
  targetId: string | null
  targetEmail: string | null
  reason: string | null
  timestamp: string
}

const ACTION_CONFIG: Record<
  string,
  { icon: typeof LogIn; color: string; bg: string }
> = {
  "User Login": {
    icon: LogIn,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
  },
  "User Login Failed": {
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  "User Logout": {
    icon: LogOut,
    color: "text-muted-foreground",
    bg: "bg-muted/30 border-border/40",
  },
  "Security Update": {
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  "Doctor Approved": {
    icon: UserCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
  },
}

function getActionConfig(action: string) {
  for (const [key, config] of Object.entries(ACTION_CONFIG)) {
    if (action.includes(key)) return config
  }
  return {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted/30 border-border/40",
  }
}

export default function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({})

  const {
    data: logs = [],
    isPending,
    error,
  } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: () => apiClient.get<AuditLog[]>("/audit-logs"),
  })

  const filtered = logs.filter((log) => {
    const term = searchQuery.toLowerCase()
    const matchesSearch =
      log.action.toLowerCase().includes(term) ||
      log.actorEmail.toLowerCase().includes(term) ||
      log.targetEmail?.toLowerCase().includes(term) ||
      log.reason?.toLowerCase().includes(term)

    const logDate = new Date(log.timestamp)
    const matchesFrom = dateRange.from
      ? logDate >= new Date(dateRange.from)
      : true
    const matchesTo = dateRange.to
      ? logDate <= new Date(`${dateRange.to}T23:59:59`)
      : true

    return matchesSearch && matchesFrom && matchesTo
  })

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Audit Logs
          </CardTitle>
          <CardDescription className="text-sm">
            Track all authentication events and security changes across the
            platform.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card border border-border/40 rounded-xl p-4 shadow-sm flex-wrap">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search action, email, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/20"
            />
          </div>
          <div className="w-full sm:w-72">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={setDateRange}
              placeholder="Filter by date range"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          <span>
            Showing:{" "}
            <strong className="text-foreground">{filtered.length}</strong> /{" "}
            {logs.length}
          </span>
          {(searchQuery || dateRange.from) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => { setSearchQuery(""); setDateRange({}) }}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {isPending && (
        <div className="border border-border/45 rounded-xl bg-card p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-2 border-b border-border/10 last:border-0"
            >
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                <div className="h-3 w-56 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">
              Failed to retrieve audit logs
            </h3>
            <p className="text-xs text-destructive/80">{error.message}</p>
          </div>
        </div>
      )}

      {!isPending && !error && filtered.length === 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <Clock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">No logs found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No audit events recorded yet."}
            </p>
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          )}
        </div>
      )}

      {!isPending && !error && filtered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Audit Events
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {filtered.length} of {logs.length} events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Actor</TableHead>
                <TableHead className="hidden md:table-cell">Target</TableHead>
                <TableHead className="hidden md:table-cell">Reason</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => {
                const config = getActionConfig(log.action)
                const Icon = config.icon
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center ${config.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-medium"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {log.actorEmail}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {log.targetEmail || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.reason || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
