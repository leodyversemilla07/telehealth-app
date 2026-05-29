"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
  FileText,
  Search,
  User,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"

interface Patient {
  id: string
  name: string | null
  email: string
  appointmentCount: number
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  COMPLETED: "text-blue-600 bg-blue-50 border-blue-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
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
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-48 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isPending && filtered.length === 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <User className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">No patients found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "You haven't seen any patients yet."}
            </p>
          </div>
        </div>
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
                      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase text-xs shrink-0">
                        {patient.name?.[0] || patient.email[0]}
                      </div>
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
                    <Button variant="outline" size="sm" className="gap-1 font-medium" render={<Link href={`/doctor/patients/${patient.id}`} />}>
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
