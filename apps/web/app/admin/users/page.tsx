"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
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
  Crown,
  HeartPulse,
  Mail,
  Search,
  Shield,
  ShieldAlert,
  ShieldMinus,
  UserCheck,
  UserX,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserDto | null>(
    null,
  )
  const [banReason, setBanReason] = useState("")
  const [selectedUserForRole, setSelectedUserForRole] = useState<{
    user: UserDto
    role: "PATIENT" | "DOCTOR" | "ADMIN"
  } | null>(null)

  // 1. Fetch Users Query
  const {
    data: users = [],
    isPending,
    error,
  } = useQuery<UserDto[]>({
    queryKey: ["users"],
    queryFn: () => apiClient.get<UserDto[]>("/admin/users"),
  })

  // 2. Mutations
  const roleMutation = useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: string
      role: "PATIENT" | "DOCTOR" | "ADMIN"
    }) =>
      apiClient.patch<{
        id: string
        email: string
        role: "PATIENT" | "DOCTOR" | "ADMIN"
      }>(`/admin/users/${id}/role`, { role }),
    onSuccess: (updatedUser) => {
      toast.success(
        `Role updated to ${updatedUser.role} for ${updatedUser.email}`,
      )
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setSelectedUserForRole(null)
    },
    onError: (err: Error) => {
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
      }>(`/admin/users/${id}/ban`, { reason }),
    onSuccess: (res) => {
      toast.success(`User ${res.email} has been banned`)
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setSelectedUserForBan(null)
      setBanReason("")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to ban user")
    },
  })

  const unbanMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ id: string; email: string; banned: boolean }>(
        `/admin/users/${id}/ban`,
      ),
    onSuccess: (res) => {
      toast.success(`User ${res.email} has been unbanned`)
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: Error) => {
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

  function handleOpenBanModal(user: UserDto) {
    setSelectedUserForBan(user)
    setBanReason("")
  }

  function handleOpenRoleModal(
    user: UserDto,
    role: "PATIENT" | "DOCTOR" | "ADMIN",
  ) {
    setSelectedUserForRole({ user, role })
  }

  function handleConfirmBan(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserForBan) return
    banMutation.mutate({
      id: selectedUserForBan.id,
      reason: banReason.trim() || undefined,
    })
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "ADMIN":
        return <Crown className="h-3 w-3" />
      case "DOCTOR":
        return <HeartPulse className="h-3 w-3" />
      default:
        return <Shield className="h-3 w-3" />
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "ADMIN":
        return "default"
      case "DOCTOR":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Title & Description */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Users Management
        </h1>
        <p className="text-sm text-muted-foreground">
          View, search, and manage registered patients, licensed providers, and
          administrative staff accounts.
        </p>
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
        <div className="border border-border/45 rounded-xl bg-card overflow-hidden">
          <div className="p-4 bg-muted/20 border-b border-border/40">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-border/10 last:border-0"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-44 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
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

      {/* User Table Dashboard */}
      {!isPending && !error && filteredUsers.length > 0 && (
        <div className="border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/15">
              <TableRow>
                <TableHead className="w-[220px]">User</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Registered
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const isAdmin = user.role === "ADMIN"
                const isBanned = user.banned === true

                return (
                  <TableRow
                    key={user.id}
                    className={
                      isBanned
                        ? "bg-destructive/[0.02] hover:bg-destructive/[0.04]"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase text-xs shrink-0">
                          {user.name?.[0] || user.email[0]}
                        </div>
                        <div className="truncate">
                          <span className="block font-semibold text-sm text-foreground truncate max-w-[150px]">
                            {user.name || "User"}
                          </span>
                          <span className="md:hidden flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            <Mail className="h-2.5 w-2.5 shrink-0" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeColor(user.role)}
                        className="text-[9px] h-5 gap-1 font-bold tracking-wider"
                      >
                        {getRoleIcon(user.role)}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isBanned ? (
                        <Badge
                          variant="destructive"
                          className="text-[9px] h-5 gap-1 font-bold"
                        >
                          <ShieldAlert className="h-2.5 w-2.5" />
                          BANNED
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[9px] h-5 text-emerald-600 border-emerald-200 bg-emerald-50/50 font-bold"
                        >
                          ACTIVE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Role Switch */}
                        {isAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] gap-1 h-7 font-medium px-2.5"
                            disabled={roleMutation.isPending}
                            onClick={() => handleOpenRoleModal(user, "DOCTOR")}
                          >
                            <ShieldMinus className="h-3 w-3" />
                            Demote
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] gap-1 h-7 font-medium px-2.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                            disabled={roleMutation.isPending}
                            onClick={() => handleOpenRoleModal(user, "ADMIN")}
                          >
                            <Crown className="h-3 w-3" />
                            Promote
                          </Button>
                        )}

                        {/* Ban / Unban */}
                        {isBanned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] gap-1 h-7 font-medium px-2.5 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                            disabled={unbanMutation.isPending}
                            onClick={() => unbanMutation.mutate(user.id)}
                          >
                            <UserCheck className="h-3 w-3" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-[11px] gap-1 h-7 font-medium px-2.5"
                            disabled={banMutation.isPending}
                            onClick={() => handleOpenBanModal(user)}
                          >
                            <UserX className="h-3 w-3" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Role Change Confirmation Dialog */}
      <Dialog
        open={!!selectedUserForRole}
        onOpenChange={(open) => !open && setSelectedUserForRole(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Select a new role for{" "}
              <strong>
                {selectedUserForRole?.user.name ||
                  selectedUserForRole?.user.email}
              </strong>
              . Current role: <strong>{selectedUserForRole?.user.role}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">New Role</Label>
              <Select
                value={selectedUserForRole?.role ?? "PATIENT"}
                onValueChange={(
                  value: "PATIENT" | "DOCTOR" | "ADMIN" | null,
                ) => {
                  if (selectedUserForRole && value) {
                    setSelectedUserForRole({
                      ...selectedUserForRole,
                      role: value,
                    })
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Patient
                    </div>
                  </SelectItem>
                  <SelectItem value="DOCTOR">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4" />
                      Provider
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedUserForRole(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              className="h-8 text-xs gap-1.5"
              disabled={
                roleMutation.isPending ||
                !selectedUserForRole ||
                selectedUserForRole.role === selectedUserForRole.user.role
              }
              onClick={() => {
                if (selectedUserForRole) {
                  roleMutation.mutate({
                    id: selectedUserForRole.user.id,
                    role: selectedUserForRole.role,
                  })
                }
              }}
            >
              {roleMutation.isPending ? "Updating..." : "Confirm Role Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Modal Form Dialog */}
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
                . Banning prevents the user from logging in.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="ban-reason" className="text-xs font-semibold">
                Reason for Ban (Optional)
              </Label>
              <Input
                id="ban-reason"
                placeholder="Violation of terms, spamming..."
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
