"use client"

import { useQuery } from "@tanstack/react-query"
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
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Mail,
  Pill,
  Search,
  User,
} from "lucide-react"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"

interface Patient {
  id: string
  name: string | null
  email: string
  appointmentCount: number
}

interface PatientRecord {
  patient: {
    id: string
    name: string | null
    email: string
    patientProfile: {
      phone: string | null
      weight: number | null
      height: number | null
      medicalHistory: unknown
    } | null
  }
  appointments: Array<{
    id: string
    startTime: string
    endTime: string
    status: string
    reason: string | null
    symptoms: string | null
    type: string
    consultation: {
      id: string
      diagnosis: string | null
      doctorNotes: string | null
      plan: string | null
      patientNotes: string | null
      prescriptions: Array<{
        id: string
        medicationName: string
        dosage: string
        frequency: string
        duration: string
        instructions: string | null
      }>
    } | null
  }>
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  COMPLETED: "text-blue-600 bg-blue-50 border-blue-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
}

export default function DoctorRecordsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  )

  const { data: patients = [], isPending } = useQuery<Patient[]>({
    queryKey: ["doctor-patients"],
    queryFn: () => apiClient.get<Patient[]>("/records/doctor/patients"),
  })

  const { data: patientRecords, isPending: recordsPending } =
    useQuery<PatientRecord>({
      queryKey: ["doctor-patient-records", selectedPatientId],
      queryFn: () =>
        apiClient.get<PatientRecord>(
          `/records/doctor/patient/${selectedPatientId}`,
        ),
      enabled: !!selectedPatientId,
    })

  const filtered = patients.filter((p) => {
    const term = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    )
  })

  // Patient detail view
  if (selectedPatientId) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPatientId(null)}
            nativeButton={false}
            render={<button />}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {recordsPending && (
          <div className="border border-border/45 rounded-xl bg-card p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b border-border/10 last:border-0"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-56 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {patientRecords && (
          <>
            {/* Patient Info Card */}
            <div className="border border-border/40 rounded-xl bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {patientRecords.patient.name?.[0] ||
                    patientRecords.patient.email[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">
                    {patientRecords.patient.name || "Patient"}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {patientRecords.patient.email}
                  </p>
                  {patientRecords.patient.patientProfile && (
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {patientRecords.patient.patientProfile.phone && (
                        <span>
                          Phone: {patientRecords.patient.patientProfile.phone}
                        </span>
                      )}
                      {patientRecords.patient.patientProfile.weight && (
                        <span>
                          Weight: {patientRecords.patient.patientProfile.weight}{" "}
                          kg
                        </span>
                      )}
                      {patientRecords.patient.patientProfile.height && (
                        <span>
                          Height: {patientRecords.patient.patientProfile.height}{" "}
                          cm
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment History */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Appointment History ({patientRecords.appointments.length})
              </h3>

              {patientRecords.appointments.length === 0 ? (
                <div className="border border-border/40 rounded-xl bg-card p-8 text-center text-sm text-muted-foreground">
                  No appointments found with this patient.
                </div>
              ) : (
                <div className="space-y-3">
                  {patientRecords.appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden"
                    >
                      {/* Appointment Header */}
                      <div className="flex items-center justify-between p-4 border-b border-border/20 bg-muted/10">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(appt.startTime).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[9px] h-5 font-bold ${STATUS_COLORS[appt.status] || ""}`}
                          >
                            {appt.status}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] h-5">
                            {appt.type}
                          </Badge>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="p-4 space-y-3">
                        {appt.reason && (
                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Reason
                            </span>
                            <p className="text-sm mt-0.5">{appt.reason}</p>
                          </div>
                        )}
                        {appt.symptoms && (
                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Symptoms
                            </span>
                            <p className="text-sm mt-0.5">{appt.symptoms}</p>
                          </div>
                        )}

                        {/* Consultation Record */}
                        {appt.consultation && (
                          <div className="mt-3 pt-3 border-t border-border/20">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
                              <FileText className="h-3.5 w-3.5" />
                              Consultation Record
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {appt.consultation.diagnosis && (
                                <div>
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Diagnosis
                                  </span>
                                  <p className="text-sm mt-0.5">
                                    {appt.consultation.diagnosis}
                                  </p>
                                </div>
                              )}
                              {appt.consultation.plan && (
                                <div>
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Plan
                                  </span>
                                  <p className="text-sm mt-0.5">
                                    {appt.consultation.plan}
                                  </p>
                                </div>
                              )}
                              {appt.consultation.doctorNotes && (
                                <div className="md:col-span-2">
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Doctor Notes
                                  </span>
                                  <p className="text-sm mt-0.5">
                                    {appt.consultation.doctorNotes}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Prescriptions */}
                            {appt.consultation.prescriptions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/20">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
                                  <Pill className="h-3.5 w-3.5" />
                                  Prescriptions
                                </div>
                                <div className="space-y-2">
                                  {appt.consultation.prescriptions.map((rx) => (
                                    <div
                                      key={rx.id}
                                      className="flex items-start gap-2 text-sm bg-muted/30 rounded-lg p-2"
                                    >
                                      <Pill className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-medium">
                                          {rx.medicationName}
                                        </span>
                                        <span className="text-muted-foreground ml-2">
                                          {rx.dosage} — {rx.frequency} —{" "}
                                          {rx.duration}
                                        </span>
                                        {rx.instructions && (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {rx.instructions}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!appt.consultation && appt.status === "COMPLETED" && (
                          <div className="mt-2 text-xs text-muted-foreground italic">
                            No consultation record yet.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // Patient list view
  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
        <p className="text-sm text-muted-foreground">
          View patient consultation history and medical records.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border/40 rounded-xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          Patients seen:{" "}
          <strong className="text-foreground">{patients.length}</strong>
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
        <div className="border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/15">
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="text-right">Appointments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase text-xs shrink-0">
                        {patient.name?.[0] || patient.email[0]}
                      </div>
                      <span className="text-sm">
                        {patient.name || "Patient"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {patient.email}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {patient.appointmentCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] gap-1 h-7 font-medium px-2.5"
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <FileText className="h-3 w-3" />
                      View Records
                    </Button>
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
