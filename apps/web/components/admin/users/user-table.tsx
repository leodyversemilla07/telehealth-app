"use client"

import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Crown,
  HeartPulse,
  Mail,
  Shield,
  ShieldAlert,
  ShieldMinus,
  UserCheck,
  UserX,
} from "lucide-react"

interface UserTableProps {
  users: UserDto[]
  onOpenRoleModal: (user: UserDto, role: "PATIENT" | "DOCTOR" | "ADMIN") => void
  onOpenBanModal: (user: UserDto) => void
  onUnban: (id: string) => void
  isRolePending: boolean
  isBanPending: boolean
  isUnbanPending: boolean
}

export function getRoleIcon(role: string) {
  switch (role) {
    case "ADMIN":
      return <Crown className="h-3 w-3" />
    case "DOCTOR":
      return <HeartPulse className="h-3 w-3" />
    default:
      return <Shield className="h-3 w-3" />
  }
}

export function getRoleBadgeColor(role: string) {
  switch (role) {
    case "ADMIN":
      return "default"
    case "DOCTOR":
      return "secondary"
    default:
      return "outline"
  }
}

export function UserTable({
  users,
  onOpenRoleModal,
  onOpenBanModal,
  onUnban,
  isRolePending,
  isBanPending,
  isUnbanPending,
}: UserTableProps) {
  return (
    <div className="border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/15">
          <TableRow>
            <TableHead className="w-[220px]">User</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
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
                        disabled={isRolePending}
                        onClick={() => onOpenRoleModal(user, "DOCTOR")}
                      >
                        <ShieldMinus className="h-3 w-3" />
                        Demote
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] gap-1 h-7 font-medium px-2.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                        disabled={isRolePending}
                        onClick={() => onOpenRoleModal(user, "ADMIN")}
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
                        disabled={isUnbanPending}
                        onClick={() => onUnban(user.id)}
                      >
                        <UserCheck className="h-3 w-3" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-[11px] gap-1 h-7 font-medium px-2.5"
                        disabled={isBanPending}
                        onClick={() => onOpenBanModal(user)}
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
  )
}

export function UserTableSkeleton() {
  return (
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
  )
}
