"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
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
  CheckCircle,
  Clock,
  Mail,
  Search,
  Stethoscope,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
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

  const {
    data: doctors = [],
    isPending,
    error,
  } = useQuery<DoctorProfile[]>({
    queryKey: ["admin-doctors"],
    queryFn: () => apiClient.get<DoctorProfile[]>("/admin/doctors"),
  })

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Doctor Verification
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and approve licensed doctors after verifying their PRC
          credentials.
        </p>
      </div>

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
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-48 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">
              Failed to retrieve doctors
            </h3>
            <p className="text-xs destructive/80 leading-relaxed">
              {error.message || "An unexpected error occurred."}
            </p>
          </div>
        </div>
      )}

      {!isPending && !error && filtered.length === 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">No doctors found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No doctor profiles yet."}
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
        <div className="border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/15">
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
                      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase text-xs shrink-0">
                        {doc.user.name?.[0] || doc.user.email[0]}
                      </div>
                      <div className="truncate">
                        <span className="block font-semibold text-sm text-foreground truncate max-w-[180px]">
                          {doc.user.name || "Doctor"}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                          <Mail className="h-2.5 w-2.5 shrink-0" />
                          {doc.user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {doc.specialty}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                    {doc.prcLicenseNumber}
                  </TableCell>
                  <TableCell>
                    {doc.isApproved ? (
                      <Badge
                        variant="outline"
                        className="text-[9px] h-5 gap-1 text-emerald-600 border-emerald-200 bg-emerald-50/50 font-bold"
                      >
                        <CheckCircle className="h-2.5 w-2.5" />
                        APPROVED
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[9px] h-5 gap-1 text-amber-600 border-amber-200 bg-amber-50/50 font-bold"
                      >
                        <Clock className="h-2.5 w-2.5" />
                        PENDING
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {doc.isApproved ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] gap-1 h-7 font-medium px-2.5 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(doc.id)}
                        >
                          <XCircle className="h-3 w-3" />
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="text-[11px] gap-1 h-7 font-medium px-2.5"
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
        </div>
      )}
    </div>
  )
}
