"use client"

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
import { Separator } from "@workspace/ui/components/separator"
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePatientRecords } from "@/hooks/use-records"

export default function PatientRecordsPage() {
  const { data: consultations = [], isPending, error } = usePatientRecords()

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Medical Records
          </CardTitle>
          <CardDescription className="text-sm">
            Review your complete consultation history, diagnoses, treatment
            plans, and prescriptions.
          </CardDescription>
        </CardHeader>
      </Card>

      {isPending && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <Card
              key={idx}
              className="animate-pulse bg-card/60 border border-border/40"
            >
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto my-12">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1 text-left">
            <h3 className="font-semibold text-sm">
              Failed to retrieve medical records
            </h3>
            <p className="text-xs text-destructive/80 leading-relaxed">
              {error.message ||
                "An unexpected error occurred while communicating with the EHR server."}
            </p>
          </div>
        </div>
      )}

      {!isPending && !error && consultations.length === 0 && (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No medical records yet</EmptyTitle>
            <EmptyDescription>
              Your consultation history will appear here once a doctor completes
              a consultation and files a medical report.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isPending && !error && consultations.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {consultations.map((record) => {
            const visitDate = new Date(
              record.appointment.startTime,
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Manila",
            })

            return (
              <Card
                key={record.id}
                className="border border-border/40 bg-card hover:shadow-md transition-all overflow-hidden relative group"
              >
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" />

                <CardHeader className="pb-3 pl-8">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-primary border-primary/20 bg-primary/5 font-extrabold uppercase py-0 leading-none mb-1"
                        >
                          Consultation Record
                        </Badge>
                        <CardTitle className="text-lg font-bold text-foreground">
                          {record.diagnosis || "Consultation"}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="bg-muted/30 border border-border/25 rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 w-fit shrink-0 font-medium text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {visitDate}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pl-8 pb-4 text-left">
                  <Separator className="bg-border/30 mb-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/20 border border-border/20 rounded-xl p-4 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                          <User className="h-3 w-3" /> Doctor
                        </span>
                        <p className="text-foreground font-semibold text-sm">
                          {record.appointment.doctor?.user?.name || "Doctor"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {record.appointment.doctor?.specialty}
                        </p>
                      </div>

                      <Separator className="bg-border/20" />

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Visit Time
                        </span>
                        <p className="text-foreground font-medium text-sm">
                          {new Date(
                            record.appointment.startTime,
                          ).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Manila",
                          })}{" "}
                          &mdash;{" "}
                          {new Date(
                            record.appointment.endTime,
                          ).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Manila",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-muted/20 border border-border/20 rounded-xl p-4 space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                          <HeartPulse className="h-3 w-3" /> Diagnosis
                        </span>
                        <p className="text-foreground text-sm font-medium">
                          {record.diagnosis || "Not specified"}
                        </p>
                      </div>

                      {record.plan && (
                        <div className="bg-muted/20 border border-border/20 rounded-xl p-4 space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Treatment Plan
                          </span>
                          <p className="text-foreground text-sm">
                            {record.plan}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {record.doctorNotes && (
                    <div className="mb-4 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Doctor&apos;s Notes
                      </span>
                      <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 text-sm leading-relaxed text-foreground italic">
                        &ldquo;{record.doctorNotes}&rdquo;
                      </div>
                    </div>
                  )}

                  {record.prescriptions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                        <Pill className="h-3 w-3" /> Prescriptions (
                        {record.prescriptions.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {record.prescriptions.map((rx) => (
                          <div
                            key={rx.id}
                            className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs space-y-1"
                          >
                            <p className="font-bold text-foreground">
                              {rx.medicationName}
                            </p>
                            <p className="text-muted-foreground">
                              {rx.dosage} &middot; {rx.frequency} &middot;{" "}
                              {rx.duration}
                            </p>
                            {rx.instructions && (
                              <p className="text-muted-foreground/70 italic">
                                {rx.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="px-8 pb-4 flex gap-2">
                  {record.prescriptions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-border/60"
                      render={<Link href="/patient/prescriptions" />}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      View All Prescriptions
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
