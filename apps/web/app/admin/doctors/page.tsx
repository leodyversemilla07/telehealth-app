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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
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
  CheckCircle,
  Clock,
  Mail,
  Search,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ErrorAlert } from "@/components/error-alert"
import { apiClient } from "@/lib/api-client"

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
    mutationFn: (id: string) =>
      apiClient.patch<DoctorProfile>(`/admin/doctors/${id}/reject`),
    onSuccess: (_doc, id) => {
      const doc = doctors.find((d) => d.id === id)
      toast.success(`${doc?.user.name || doc?.user.email || "Doctor"} rejected`)
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reject doctor")
    },
  })

  const filtered = doctors.filter((doc) => {
    const term = searchQuery.toLowerCase()
    return (
      doc.user.email.toLowerCase().includes(term) ||
      doc.user.name?.toLowerCase().includes(term) ||
      doc.specialty?.toLowerCase().includes(term) ||
      doc.prcLicenseNumber?.toLowerCase().includes(term)
    )
  })

  const pending = doctors.filter((d) => !d.isApproved).length
  const approved = doctors.filter((d) => d.isApproved).length

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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            Pending: <strong className="text-foreground">{pending}</strong>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            Approved: <strong className="text-foreground">{approved}</strong>
          </span>
          <span>
            Total: <strong className="text-foreground">{doctors.length}</strong>
          </span>
        </div>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Doctors
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {filtered.length} of {doctors.length} doctors
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
                {filtered.map((doc) => (
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
                        <Badge
                          variant="outline"
                          className="gap-1 text-success border-success/30 bg-success/10 font-medium"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Approved
                        </Badge>
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 font-medium text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate(doc.id)}
                          >
                            <XCircle className="h-4 w-4" />
                            Revoke
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs gap-1 h-7 font-medium px-2.5"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(doc.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
