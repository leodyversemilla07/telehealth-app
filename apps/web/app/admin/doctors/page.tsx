"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  CheckCircle,
  Clock,
  Mail,
  Search,
  ShieldCheck,
  ShieldOff,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ErrorAlert } from "@/components/error-alert"
import { apiClient } from "@/lib/api-client"

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

interface DoctorProfile {
  id: string
  userId: string
  specialty: string
  prcLicenseNumber: string
  prcLicenseExpiry: string
  philhealthAccreditation: string | null
  bio: string | null
  clinicAddress: string | null
  pricePerVisit: number | string
  isApproved: boolean
  isVerified: boolean
  rejectionReason: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(10)

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () =>
      apiClient.get<{ items: DoctorProfile[]; total: number }>(
        "/admin/doctors",
      ),
  })
  const doctors = data?.items ?? []

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<DoctorProfile>(`/admin/doctors/${id}/approve`),
    onSuccess: (_doc, id) => {
      const doc = doctors.find((d) => d.id === id)
      toast.success(`${doc?.user.name || doc?.user.email || "Doctor"} approved`)
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve doctor")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (args: { id: string; reason?: string }) =>
      apiClient.patch<DoctorProfile>(`/admin/doctors/${args.id}/reject`, {
        reason: args.reason?.trim() ? args.reason.trim() : undefined,
      }),
    onSuccess: (_doc, { id }) => {
      const doc = doctors.find((d) => d.id === id)
      toast.success(`${doc?.user.name || doc?.user.email || "Doctor"} rejected`)
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reject doctor")
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (args: { id: string; verify: boolean }) =>
      apiClient.patch<DoctorProfile>(
        `/admin/doctors/${args.id}/${args.verify ? "verify" : "unverify"}`,
      ),
    onSuccess: (_doc, { verify }) => {
      toast.success(
        verify
          ? "Credentials marked as verified"
          : "Verification badge removed",
      )
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update verification status")
    },
  })

  // Reject-reason dialog state
  const [rejectTarget, setRejectTarget] = useState<DoctorProfile | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejecting, setRejecting] = useState(false)

  async function confirmReject() {
    if (!rejectTarget) return
    setRejecting(true)
    try {
      await rejectMutation.mutateAsync({
        id: rejectTarget.id,
        reason: rejectReason.trim() || undefined,
      })
      setRejectTarget(null)
      setRejectReason("")
    } catch {
      // toast already shown by mutation
    } finally {
      setRejecting(false)
    }
  }

  // Client-side filtering
  const filtered = useMemo(() => {
    return doctors.filter((doc) => {
      const term = searchQuery.toLowerCase()
      const matchesSearch =
        doc.user.email.toLowerCase().includes(term) ||
        doc.user.name?.toLowerCase().includes(term) ||
        doc.specialty?.toLowerCase().includes(term) ||
        doc.prcLicenseNumber?.toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" &&
          !doc.isApproved &&
          !doc.rejectionReason) ||
        (statusFilter === "APPROVED" && doc.isApproved) ||
        (statusFilter === "REJECTED" &&
          !doc.isApproved &&
          Boolean(doc.rejectionReason))
      return matchesSearch && matchesStatus
    })
  }, [doctors, searchQuery, statusFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paginated = filtered.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize,
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(0)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setPage(0)
  }

  const pending = doctors.filter(
    (d) => !d.isApproved && !d.rejectionReason,
  ).length
  const approved = doctors.filter((d) => d.isApproved).length
  const rejected = doctors.filter(
    (d) => !d.isApproved && Boolean(d.rejectionReason),
  ).length

  const statusCounts = {
    ALL: doctors.length,
    PENDING: pending,
    APPROVED: approved,
    REJECTED: rejected,
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Doctor Verification
          </CardTitle>
          <CardDescription className="text-sm">
            Review and approve licensed doctors after verifying their PRC
            credentials.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border/40 rounded-xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or specialty..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-warning" />
            Pending: <strong className="text-foreground">{pending}</strong>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-success" />
            Approved: <strong className="text-foreground">{approved}</strong>
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-destructive" />
            Rejected: <strong className="text-foreground">{rejected}</strong>
          </span>
          <span>
            Total: <strong className="text-foreground">{doctors.length}</strong>
          </span>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusFilterChange(status)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border ${
              statusFilter === status
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
            }`}
          >
            <Users className="h-3 w-3" />
            {status === "ALL"
              ? "All"
              : status.charAt(0) + status.slice(1).toLowerCase()}
            <span
              className={`ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0 text-[10px] font-bold ${
                statusFilter === status
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted-foreground/10 text-muted-foreground"
              }`}
            >
              {statusCounts[status as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {isPending && (
        <div className="border border-border/45 rounded-xl bg-card p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-2 border-b border-border/10 last:border-0"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <ErrorAlert
          title="Failed to retrieve doctors"
          description={error.message || "An unexpected error occurred."}
        />
      )}

      {!isPending && !error && filtered.length === 0 && (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Stethoscope className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No doctors found</EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No doctor profiles yet."}
            </EmptyDescription>
          </EmptyHeader>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          )}
        </Empty>
      )}

      {!isPending && !error && filtered.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Doctors
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {paginated.length} of {filtered.length} doctors
                {filtered.length < doctors.length &&
                  ` (filtered from ${doctors.length})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Specialty
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      PRC License
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="sm"
                            className="border border-primary/20 shrink-0"
                          >
                            <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase text-xs">
                              {doc.user.name?.[0] || doc.user.email[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <span className="block font-medium text-sm text-foreground truncate max-w-[180px]">
                              {doc.user.name || "Doctor"}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              {doc.user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {doc.specialty}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-mono text-muted-foreground">
                        {doc.prcLicenseNumber}
                      </TableCell>
                      <TableCell>
                        {doc.isApproved ? (
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant="outline"
                              className="gap-1 text-success border-success/30 bg-success/10 font-medium"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </Badge>
                            {doc.isVerified && (
                              <Badge
                                variant="outline"
                                className="gap-1 text-primary border-primary/30 bg-primary/10 font-medium"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        ) : doc.rejectionReason ? (
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant="outline"
                              className="gap-1 text-destructive border-destructive/30 bg-destructive/10 font-medium"
                            >
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </Badge>
                            <span
                              className="max-w-[220px] truncate text-xs text-muted-foreground"
                              title={doc.rejectionReason}
                            >
                              {doc.rejectionReason}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 text-warning border-warning/30 bg-warning/10 font-medium"
                          >
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.isApproved ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 font-medium text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                                title={
                                  doc.isVerified
                                    ? "Remove verification badge"
                                    : "Mark credentials as verified (checked against PRC registry)"
                                }
                                disabled={
                                  verifyMutation.isPending ||
                                  rejectMutation.isPending
                                }
                                onClick={() =>
                                  verifyMutation.mutate({
                                    id: doc.id,
                                    verify: !doc.isVerified,
                                  })
                                }
                              >
                                {doc.isVerified ? (
                                  <ShieldOff className="h-4 w-4" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4" />
                                )}
                                {doc.isVerified ? "Unverify" : "Verify"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 font-medium text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                                disabled={
                                  rejectMutation.isPending ||
                                  verifyMutation.isPending
                                }
                                onClick={() => {
                                  setRejectTarget(doc)
                                  setRejectReason("")
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                                Revoke
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 font-medium text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                                title="Reject this application"
                                disabled={rejectMutation.isPending}
                                onClick={() => {
                                  setRejectTarget(doc)
                                  setRejectReason("")
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="text-xs gap-1 h-7 font-medium px-2.5"
                                disabled={approveMutation.isPending}
                                onClick={() => approveMutation.mutate(doc.id)}
                              >
                                {approveMutation.isPending ? (
                                  <Spinner className="mr-1 h-3.5 w-3.5" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                {approveMutation.isPending
                                  ? "Approving..."
                                  : "Approve"}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between bg-card border border-border/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(0)
                }}
                className="bg-muted/30 border border-border/60 rounded-md px-2 py-1 text-xs font-medium text-foreground"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-muted-foreground">
              Page {safePage + 1} of {totalPages}
              <span className="mx-2">·</span>
              {filtered.length} total
            </span>
            <Pagination>
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

      {/* Reject dialog (with optional reason) */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
            setRejectReason("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rejectTarget?.isApproved
                ? "Revoke doctor approval"
                : "Reject application"}
            </DialogTitle>
            <DialogDescription>
              {rejectTarget?.isApproved
                ? "This will hide the doctor from patients immediately. The doctor will be notified of the rejection reason."
                : "Explain why the application was rejected so the doctor can fix it and resubmit."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              id="rejectReason"
              className="min-h-[100px]"
              placeholder={
                rejectTarget?.isApproved
                  ? "e.g. PRC license could not be validated against the registry"
                  : "e.g. PRC license number does not match the official registry. Please double-check and resubmit."
              }
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              aria-label="Rejection reason"
            />
            <p className="text-xs text-muted-foreground text-right">
              {rejectReason.length}/500
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectTarget(null)
                setRejectReason("")
              }}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmReject}
              disabled={rejecting}
            >
              {rejecting ? "Submitting..." : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
