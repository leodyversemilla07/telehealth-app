"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AuditLogDto, UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import {
  Activity,
  AlertCircle,
  Calendar,
  Clock,
  Crown,
  FileText,
  Mail,
  Search,
  ShieldAlert,
  ShieldMinus,
  UserCheck,
  UserX,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { type ApiError, apiClient } from "@/lib/api-client"

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [logSearchQuery, setLogSearchQuery] = useState("")
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserDto | null>(
    null,
  )
  const [banReason, setBanReason] = useState("")

  // 1. Fetch Users Query
  const {
    data: users = [],
    isPending,
    error,
  } = useQuery<UserDto[]>({
    queryKey: ["users"],
    queryFn: () => apiClient.get<UserDto[]>("/users"),
  })

  // 1.5. Fetch Audit Logs Query
  const { data: auditLogs = [], isPending: logsPending } = useQuery<
    AuditLogDto[]
  >({
    queryKey: ["audit-logs"],
    queryFn: () => apiClient.get<AuditLogDto[]>("/audit-logs"),
  })

  // 2. Mutations
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "ADMIN" | "USER" }) =>
      apiClient.patch<{ id: string; email: string; role: "ADMIN" | "USER" }>(
        `/users/${id}/role`,
        { role },
      ),
    onSuccess: (updatedUser) => {
      toast.success(
        `Role updated to ${updatedUser.role} for ${updatedUser.email}`,
      )
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] })
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to update user role")
    },
  })

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<{
        id: string
        email: string
        banned: boolean
        banReason?: string | null
      }>(`/users/${id}/ban`, { reason }),
    onSuccess: (res) => {
      toast.error(`User ${res.email} has been banned`)
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] })
      setSelectedUserForBan(null)
      setBanReason("")
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to ban user")
    },
  })

  const unbanMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ id: string; email: string; banned: boolean }>(
        `/users/${id}/ban`,
      ),
    onSuccess: (res) => {
      toast.success(`User ${res.email} has been unbanned`)
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] })
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to unban user")
    },
  })

  // Client-side local filtering
  const filteredUsers = users.filter((user) => {
    const term = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term)
    )
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

  function handleOpenBanModal(user: UserDto) {
    setSelectedUserForBan(user)
    setBanReason("")
  }

  function handleConfirmBan(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserForBan) return
    banMutation.mutate({
      id: selectedUserForBan.id,
      reason: banReason.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Users Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage system roles, access statuses, and bans across the workspace.
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border/40 rounded-xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          <span>
            Total users:{" "}
            <strong className="text-foreground">{users.length}</strong>
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span>
            Filtered:{" "}
            <strong className="text-foreground">{filteredUsers.length}</strong>
          </span>
        </div>
      </div>

      {/* Primary Loading State */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton loaders do not have stable unique identifiers
            <Card key={idx} className="animate-pulse bg-card/60">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-3 w-40 bg-muted rounded" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <div className="h-8 w-24 bg-muted rounded-md" />
                <div className="h-8 w-20 bg-muted rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Failed to retrieve users</h3>
            <p className="text-xs text-destructive/80 leading-relaxed">
              {error.message ||
                "An unexpected error occurred while communicating with the administrative API."}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isPending && !error && filteredUsers.length === 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">
              No matching users found
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your search for &ldquo;{searchQuery}&rdquo; yielded no results.
              Double-check spelling or try searching for another term.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery("")}
          >
            Reset search filter
          </Button>
        </div>
      )}

      {/* User Grid Dashboard */}
      {!isPending && !error && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const isAdmin = user.role === "ADMIN"
            const isBanned = user.banned === true

            return (
              <Card
                key={user.id}
                className={`relative overflow-hidden group border transition-all duration-300 ${
                  isBanned
                    ? "border-destructive/30 bg-destructive/5 hover:border-destructive/40 shadow-destructive/5"
                    : "border-border/40 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 bg-card"
                }`}
              >
                {/* Visual side band for premium touch */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    isBanned
                      ? "bg-destructive"
                      : isAdmin
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                  }`}
                />

                <CardHeader className="flex flex-row items-start gap-4 pb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase text-sm shrink-0">
                    {user.name?.[0] || user.email[0]}
                  </div>
                  <div className="overflow-hidden space-y-1 flex-1 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CardTitle className="truncate font-semibold text-sm text-foreground max-w-[150px]">
                        {user.name || "User"}
                      </CardTitle>
                      {isAdmin && (
                        <Badge
                          variant="default"
                          className="text-[9px] h-4 gap-0.5 font-bold"
                        >
                          <Crown className="h-2.5 w-2.5" />
                          ADMIN
                        </Badge>
                      )}
                      {isBanned && (
                        <Badge
                          variant="destructive"
                          className="text-[9px] h-4 gap-0.5 font-bold"
                        >
                          <ShieldAlert className="h-2.5 w-2.5" />
                          BANNED
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs truncate">
                      <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {user.email}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="text-xs text-muted-foreground space-y-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>
                      Registered:{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {isBanned && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Ban Details
                      </div>
                      <p className="text-[11px] leading-normal break-words italic">
                        &ldquo;
                        {user.banReason || "No explicit reason specified."}
                        &rdquo;
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pt-3 bg-muted/10">
                  <div className="flex gap-2 w-full">
                    {/* Toggle Admin Privilege Action */}
                    {isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[11px] gap-1.5 h-8 font-medium"
                        disabled={roleMutation.isPending}
                        onClick={() =>
                          roleMutation.mutate({ id: user.id, role: "USER" })
                        }
                      >
                        <ShieldMinus className="h-3.5 w-3.5" />
                        Demote
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[11px] gap-1.5 h-8 font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                        disabled={roleMutation.isPending}
                        onClick={() =>
                          roleMutation.mutate({ id: user.id, role: "ADMIN" })
                        }
                      >
                        <Crown className="h-3.5 w-3.5" />
                        Promote
                      </Button>
                    )}

                    {/* Ban / Unban Action */}
                    {isBanned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[11px] gap-1.5 h-8 font-medium hover:bg-success/5 hover:text-success hover:border-success/30"
                        disabled={unbanMutation.isPending}
                        onClick={() => unbanMutation.mutate(user.id)}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-[11px] gap-1.5 h-8 font-medium"
                        disabled={banMutation.isPending}
                        onClick={() => handleOpenBanModal(user)}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Ban User
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* System Activity & Audit Logs */}
      <Card className="border border-border/40 bg-card/60 shadow-lg backdrop-blur-md mt-8">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              System Activity & Audit Logs
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time audit history tracing administrator updates, user bans,
              and profile changes.
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search audit actions, actors..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-muted/20"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {logsPending ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton loaders do not have stable unique identifiers
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
            <div className="text-center py-12 text-muted-foreground text-xs">
              No audit logs match your search.
            </div>
          ) : (
            <div className="relative border-l border-border pl-6 ml-4 space-y-6">
              {filteredLogs.map((log) => {
                let icon = <FileText className="h-3.5 w-3.5" />
                let colorClass = "bg-muted text-muted-foreground border-border"
                const action = log.action.toLowerCase()

                if (action.includes("ban")) {
                  icon = <UserX className="h-3.5 w-3.5" />
                  colorClass =
                    "bg-destructive/10 text-destructive border-destructive/20"
                } else if (action.includes("unban")) {
                  icon = <UserCheck className="h-3.5 w-3.5" />
                  colorClass =
                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                } else if (action.includes("role")) {
                  icon = <Crown className="h-3.5 w-3.5" />
                  colorClass = "bg-primary/10 text-primary border-primary/20"
                } else if (action.includes("session")) {
                  icon = <ShieldAlert className="h-3.5 w-3.5" />
                  colorClass =
                    "bg-amber-500/10 text-amber-500 border-amber-500/20"
                } else if (action.includes("profile")) {
                  icon = <UserCheck className="h-3.5 w-3.5" />
                  colorClass = "bg-sky-500/10 text-sky-500 border-sky-500/20"
                }

                return (
                  <div key={log.id} className="relative group">
                    <div
                      className={`absolute -left-[38px] top-1 h-6 w-6 rounded-full border flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 ${colorClass}`}
                    >
                      {icon}
                    </div>

                    <div className="space-y-1.5 p-3 rounded-lg border border-border/20 bg-muted/5 group-hover:bg-muted/15 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground">
                          {log.action}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground leading-normal space-y-1">
                        <div>
                          Actor:{" "}
                          <span className="font-medium text-foreground">
                            {log.actorEmail}
                          </span>
                        </div>
                        {log.targetEmail && (
                          <div>
                            Target:{" "}
                            <span className="font-medium text-foreground">
                              {log.targetEmail}
                            </span>
                          </div>
                        )}
                        {log.reason && (
                          <div className="mt-1 text-[10px] italic border-l-2 border-border pl-2 py-0.5 text-muted-foreground/80">
                            &ldquo;{log.reason}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Ban User Modal Form Dialog */}
      <Dialog
        open={!!selectedUserForBan}
        onOpenChange={(open) => !open && setSelectedUserForBan(null)}
      >
        <DialogContent className="max-w-sm">
          <form onSubmit={handleConfirmBan} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <UserX className="h-5 w-5" />
                Ban User Account
              </DialogTitle>
              <DialogDescription>
                You are about to ban{" "}
                <strong>
                  {selectedUserForBan?.name || selectedUserForBan?.email}
                </strong>
                . Banning prevents the user from authenticated sessions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="ban-reason" className="text-xs font-semibold">
                Reason for Ban (Optional)
              </Label>
              <Input
                id="ban-reason"
                placeholder="Violation of community terms, spamming..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                autoComplete="off"
                className="bg-muted/10 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedUserForBan(null)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="h-8 text-xs gap-1.5"
                disabled={banMutation.isPending}
              >
                {banMutation.isPending ? "Banning..." : "Confirm Ban"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
