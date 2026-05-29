"use client"

import { useQuery } from "@tanstack/react-query"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
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
import { FileText, Search, User, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"

interface Patient {
  id: string
  name: string | null
  email: string
  appointmentCount: number
}

const _STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "text-success bg-success/10 border-success/30",
  COMPLETED: "text-info bg-info/10 border-info/30",
  CANCELLED: "text-destructive bg-destructive/10 border-destructive/30",
  PENDING: "text-warning bg-warning/10 border-warning/30",
}

export default function DoctorPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data: patients = [], isPending } = useQuery<Patient[]>({
    queryKey: ["doctor-patients"],
    queryFn: () => apiClient.get<Patient[]>("/records/doctor/patients"),
  })

  const filtered = patients.filter((p) => {
    const term = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    )
  })

  // Patient list view
  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Patients
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Patients you&apos;ve seen. Click a patient to view their records.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

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
        <div className="text-xs text-muted-foreground font-medium">
          Total: <strong className="text-foreground">{patients.length}</strong>
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
            </div>
          ))}
        </div>
      )}

      {!isPending && filtered.length === 0 && (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <User className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No patients found</EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "You haven't seen any patients yet."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isPending && filtered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Patients
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {filtered.length} patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-right">Appointments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((patient) => (
                  <TableRow key={patient.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link
                        href={`/doctor/patients/${patient.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar
                          size="sm"
                          className="border border-primary/20 shrink-0"
                        >
                          <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase text-xs">
                            {patient.name?.[0] || patient.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {patient.name || "Patient"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      <Link href={`/doctor/patients/${patient.id}`}>
                        {patient.email}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {patient.appointmentCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 font-medium"
                        nativeButton={false}
                        render={
                          <Link href={`/doctor/patients/${patient.id}`} />
                        }
                      >
                        <FileText className="h-4 w-4" />
                        View Records
                      </Button>
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
