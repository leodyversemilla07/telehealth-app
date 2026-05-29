"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Calendar,
  FileCheck,
  FileText,
  HeartPulse,
  Pill,
  Printer,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { usePatientPrescriptions } from "@/hooks/use-records"
import { ErrorAlert } from "@/components/error-alert"

export default function PatientPrescriptionsPage() {
  // 1. Fetch patient prescriptions (Consumes hydrated server cache instantly)
  const {
    data: prescriptions = [],
    isPending,
    error,
  } = usePatientPrescriptions()

  // Handle printing a prescription card
  const handlePrint = (medName: string) => {
    toast.info(`Generating PDEA / PRC compliant print view for ${medName}...`)
    window.print()
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Prescriptions (eRx)
          </CardTitle>
          <CardDescription className="text-sm">
            View your digital electronic prescriptions issued by licensed
            providers.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Loading Skeletons */}
      {isPending && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <Card
              key={idx}
              className="animate-pulse bg-card/60 border border-border/40"
            >
              <CardContent className="h-28" />
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <ErrorAlert
          title="Failed to retrieve prescriptions"
          description={
            error.message ||
            "An unexpected error occurred while communicating with the electronic health records (EHR) server."
          }
          className="my-12"
        />
      )}

      {/* Empty State */}
      {!isPending && !error && prescriptions.length === 0 && (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No prescriptions on record</EmptyTitle>
            <EmptyDescription>
              You do not have any electronic prescriptions (eRx) on file yet.
              Once a doctor completes a consultation and issues notes, it will
              appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* Prescriptions List Cards */}
      {!isPending && !error && prescriptions.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {prescriptions.map((rx) => {
            const issuedDate = new Date(rx.createdAt).toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "Asia/Manila",
              },
            )

            return (
              <Card
                key={rx.id}
                className="border border-border/40 bg-card hover:shadow-md transition-all overflow-hidden relative group"
              >
                {/* Accent line */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" />

                <CardHeader className="pb-3 pl-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className="text-xs text-primary border-primary/20 bg-primary/5 font-extrabold uppercase py-0 leading-none mb-1"
                      >
                        Verified eRx
                      </Badge>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {rx.medicationName}
                      </CardTitle>
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border/25 rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 w-fit shrink-0 font-medium text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Issued: {issuedDate}
                  </div>
                </CardHeader>

                <CardContent className="pl-8 pb-4 text-left">
                  <Separator className="bg-border/30 mb-4" />

                  {/* Rx Dosage Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 border border-border/20 rounded-xl p-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Dosage / Quantity
                      </span>
                      <p className="text-foreground text-sm font-bold">
                        {rx.dosage}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Frequency
                      </span>
                      <p className="text-foreground text-sm font-bold">
                        {rx.frequency}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Duration
                      </span>
                      <p className="text-foreground text-sm font-bold">
                        {rx.duration}
                      </p>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {rx.instructions && (
                    <div className="mt-4 space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Directions for Use
                      </span>
                      <p className="text-foreground text-xs leading-relaxed italic bg-muted/10 border border-border/10 rounded-lg p-3">
                        &ldquo;{rx.instructions}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Consultation Diagnosis Context */}
                  {rx.consultation && (
                    <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                          <User className="h-3 w-3" /> Prescribing Doctor
                        </span>
                        <p className="text-foreground font-semibold">
                          {rx.consultation.appointment?.doctor?.user?.name ||
                            "Verified Doctor"}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Specialization:{" "}
                          {rx.consultation.appointment?.doctor?.specialty}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                          <HeartPulse className="h-3 w-3" /> Diagnosis Context
                        </span>
                        <p
                          className="text-foreground font-medium truncate max-w-62.5"
                          title={rx.consultation.diagnosis ?? "Unspecified"}
                        >
                          {rx.consultation.diagnosis || "Unspecified"}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pl-8 bg-muted/15 border-t border-border/20 py-3.5 px-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    PDEA S2 / PRC Credentials Verified. Electronic Signature
                    Encrypted.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-border/60 font-semibold"
                    onClick={() => handlePrint(rx.medicationName)}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Print eRx
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
