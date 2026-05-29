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
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Mail,
  Pill,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"

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

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.patientId as string

  const { data: patientRecords, isPending } = useQuery<PatientRecord>({
    queryKey: ["doctor-patient-records", patientId],
    queryFn: () =>
      apiClient.get<PatientRecord>(`/records/doctor/patient/${patientId}`),
  })

  if (isPending) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
        </Card>
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
      </div>
    )
  }

  if (!patientRecords) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Patient Not Found
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                The requested patient could not be found.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/doctor/patients" />} className="sm:w-fit">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to patients
            </Button>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {patientRecords.patient.name?.[0] ||
                patientRecords.patient.email[0]}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {patientRecords.patient.name || "Patient"}
              </CardTitle>
              <CardDescription className="text-sm mt-1 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {patientRecords.patient.email}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/doctor/patients" />} className="sm:w-fit">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to patients
          </Button>
        </CardHeader>
      </Card>

      {/* Patient Details */}
      {patientRecords.patient.patientProfile && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {patientRecords.patient.patientProfile.phone && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">Phone:</span>{" "}
                {patientRecords.patient.patientProfile.phone}
              </span>
            )}
            {patientRecords.patient.patientProfile.weight && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">Weight:</span>{" "}
                {patientRecords.patient.patientProfile.weight} kg
              </span>
            )}
            {patientRecords.patient.patientProfile.height && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">Height:</span>{" "}
                {patientRecords.patient.patientProfile.height} cm
              </span>
            )}
          </CardContent>
        </Card>
      )}

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
              <Card key={appt.id}>
                <div className="flex items-center justify-between p-4 border-b border-border/20 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(appt.startTime).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                                    {rx.dosage} — {rx.frequency} — {rx.duration}
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
