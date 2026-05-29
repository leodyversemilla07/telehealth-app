"use client"

import type { UserDto } from "@workspace/shared"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
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
import { Skeleton } from "@workspace/ui/components/skeleton"

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
    <Card>
      <Table>
        <TableHeader>
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
                    <Avatar size="sm" className="border border-primary/20 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase text-xs">
                        {user.name?.[0] || user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <span className="block font-semibold text-sm text-foreground truncate max-w-[150px]">
                        {user.name || "User"}
                      </span>
                      <span className="md:hidden flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Mail className="h-3 w-3 shrink-0" />
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
                    className="gap-1 font-medium"
                  >
                    {getRoleIcon(user.role)}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isBanned ? (
                    <Badge
                      variant="destructive"
                      className="gap-1 font-medium"
                    >
                      <ShieldAlert className="h-3 w-3" />
                      Banned
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 text-success border-success/30 bg-success/10 font-medium"
                    >
                      <UserCheck className="h-3 w-3" />
                      Active
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
                        className="text-xs gap-1 h-7 font-medium px-2.5"
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
                        className="text-xs gap-1 h-7 font-medium px-2.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
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
                        className="text-xs gap-1 h-7 font-medium px-2.5 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
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
                        className="text-xs gap-1 h-7 font-medium px-2.5"
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
    </Card>
  )
}

export function UserTableSkeleton() {
  return (
    <Card>
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-2 border-b border-border/10 last:border-0"
          >
            <div className="flex items-center gap-4 flex-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-44 rounded" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </Card>
  )
}
