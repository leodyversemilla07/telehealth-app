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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Search, Users } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { BanDialog } from "@/components/admin/users/ban-dialog"
import { RoleDialog } from "@/components/admin/users/role-dialog"
import { UserSearchBar } from "@/components/admin/users/user-search-bar"
import {
  UserTable,
  UserTableSkeleton,
} from "@/components/admin/users/user-table"
import { ErrorAlert } from "@/components/error-alert"
import { apiClient } from "@/lib/api-client"
import { getPageItems } from "@/lib/page-items"

const ROLES = ["ALL", "PATIENT", "DOCTOR", "ADMIN"] as const
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(10)
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserDto | null>(
    null,
  )
  const [banReason, setBanReason] = useState("")
  const [selectedUserForRole, setSelectedUserForRole] = useState<{
    user: UserDto
    role: "PATIENT" | "DOCTOR" | "ADMIN"
  } | null>(null)

  // 1. Fetch Users Query
  const { data, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      apiClient.get<{ items: UserDto[]; total: number }>("/admin/users"),
  })
  const users = data?.items ?? []

  // Client-side filtering by search + role
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const term = searchQuery.toLowerCase()
      const matchesSearch =
        user.email.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term)
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paginatedUsers = filteredUsers.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize,
  )
  const pageItems = useMemo(
    () => getPageItems(safePage + 1, totalPages),
    [safePage, totalPages],
  )

  // Reset page when filters change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setPage(0)
  }

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role)
    setPage(0)
  }

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

  // Role filter counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: users.length }
    for (const u of users) {
      counts[u.role] = (counts[u.role] || 0) + 1
    }
    return counts
  }, [users])

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
            View, search, and manage registered patients, licensed providers,
            and administrative staff accounts.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Control bar */}
      <UserSearchBar
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        totalCount={users.length}
        filteredCount={filteredUsers.length}
      />

      {/* Role filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => handleRoleFilterChange(role)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border ${
              roleFilter === role
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
            }`}
          >
            <Users className="h-3 w-3" />
            {role === "ALL"
              ? "All"
              : role.charAt(0) + role.slice(1).toLowerCase()}
            <span
              className={`ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0 text-[10px] font-bold ${
                roleFilter === role
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted-foreground/10 text-muted-foreground"
              }`}
            >
              {roleCounts[role] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Primary Loading State */}
      {isPending && <UserTableSkeleton />}

      {/* Error state */}
      {error && (
        <ErrorAlert
          title="Failed to retrieve users"
          description={
            error.message ||
            "An unexpected error occurred while communicating with the administrative API."
          }
        />
      )}

      {/* Empty State */}
      {!isPending && !error && filteredUsers.length === 0 && (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No matching users found</EmptyTitle>
            <EmptyDescription>
              Your search for &ldquo;{searchQuery}&rdquo; yielded no results.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Reset search filter
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {/* User Table Dashboard */}
      {!isPending && !error && filteredUsers.length > 0 && (
        <>
          <UserTable
            users={paginatedUsers}
            onOpenRoleModal={handleOpenRoleModal}
            onOpenBanModal={handleOpenBanModal}
            onUnban={(id) => unbanMutation.mutate(id)}
            isRolePending={roleMutation.isPending}
            isBanPending={banMutation.isPending}
            isUnbanPending={unbanMutation.isPending}
          />

          {/* Pagination (shadcn) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(0)
                }}
              >
                <SelectTrigger id="rows-per-page" className="h-7 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              Page {safePage + 1} of {totalPages}
              <span className="mx-2 hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                {filteredUsers.length} total
              </span>
            </span>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text=""
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className={
                      safePage === 0 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {pageItems.map((item) =>
                  item === "start-ellipsis" || item === "end-ellipsis" ? (
                    <PaginationItem key={item}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={item === safePage + 1}
                        onClick={() => setPage(item - 1)}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    text=""
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    className={
                      safePage >= totalPages - 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
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
