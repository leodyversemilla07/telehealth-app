"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UserDto } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { AlertCircle, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { BanDialog } from "@/components/admin/users/ban-dialog"
import { RoleDialog } from "@/components/admin/users/role-dialog"
import { UserSearchBar } from "@/components/admin/users/user-search-bar"
import {
  UserTable,
  UserTableSkeleton,
} from "@/components/admin/users/user-table"
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

  function handleConfirmRoleChange() {
    if (selectedUserForRole) {
      roleMutation.mutate({
        id: selectedUserForRole.user.id,
        role: selectedUserForRole.role,
      })
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Title & Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Users Management
          </CardTitle>
          <CardDescription className="text-sm">
            View, search, and manage registered patients, licensed providers, and
            administrative staff accounts.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Control bar */}
      <UserSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={users.length}
        filteredCount={filteredUsers.length}
      />

      {/* Primary Loading State */}
      {isPending && <UserTableSkeleton />}

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
        <UserTable
          users={filteredUsers}
          onOpenRoleModal={handleOpenRoleModal}
          onOpenBanModal={handleOpenBanModal}
          onUnban={(id) => unbanMutation.mutate(id)}
          isRolePending={roleMutation.isPending}
          isBanPending={banMutation.isPending}
          isUnbanPending={unbanMutation.isPending}
        />
      )}

      {/* Role Change Confirmation Dialog */}
      <RoleDialog
        isOpen={!!selectedUserForRole}
        onClose={() => setSelectedUserForRole(null)}
        selectedUserForRole={selectedUserForRole}
        onChangeSelectedRole={(role) => {
          if (selectedUserForRole) {
            setSelectedUserForRole({ ...selectedUserForRole, role })
          }
        }}
        onConfirm={handleConfirmRoleChange}
        isPending={roleMutation.isPending}
      />

      {/* Ban User Modal Form Dialog */}
      <BanDialog
        isOpen={!!selectedUserForBan}
        onClose={() => setSelectedUserForBan(null)}
        selectedUserForBan={selectedUserForBan}
        banReason={banReason}
        onBanReasonChange={setBanReason}
        onConfirm={handleConfirmBan}
        isPending={banMutation.isPending}
      />
    </div>
  )
}
