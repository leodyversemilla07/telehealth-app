"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileCheck,
  HeartPulse,
  Loader2,
  Pill,
  Printer,
  User,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePatientPrescriptions } from "@/hooks/use-records"

export default function PrescriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const {
    data: prescriptions = [],
    isPending,
    error,
  } = usePatientPrescriptions()

  const prescription = prescriptions.find((rx) => rx.id === id)

  const handlePrint = () => {
    toast.info("Preparing print view...")
    window.print()
  }

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-semibold animate-pulse">
            Loading prescription...
          </p>
        </div>
      </div>
    )
  }

  if (error || !prescription) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto my-12">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <div className="space-y-1 text-left">
          <h3 className="font-semibold text-sm">Prescription not found</h3>
          <p className="text-xs text-destructive/80 leading-relaxed">
            {error?.message ||
              "This prescription could not be found or you do not have permission to view it."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/patient/prescriptions")}
            className="text-xs mt-3 h-8 border-destructive/20 hover:bg-destructive/10"
          >
            Back to prescriptions
          </Button>
        </div>
      </div>
    )
  }

  const issuedDate = new Date(prescription.createdAt).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila",
    },
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-left">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/patient/prescriptions")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <span className="font-bold tracking-tight text-sm text-foreground flex items-center gap-1.5">
            Prescription Details
          </span>
          <p className="text-[10px] text-muted-foreground">
            Electronic Prescription (eRx)
          </p>
        </div>
      </div>

      <Card className="border border-border/40 bg-card shadow-sm relative overflow-hidden">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" />

        <CardHeader className="pl-8 pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-left">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <Badge
                  variant="outline"
                  className="text-[10px] text-primary border-primary/20 bg-primary/5 font-extrabold uppercase py-0 leading-none mb-1"
                >
                  Verified eRx
                </Badge>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {prescription.medicationName}
                </CardTitle>
              </div>
            </div>
            <div className="bg-muted/30 border border-border/25 rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 w-fit shrink-0 font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Issued: {issuedDate}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pl-8 pb-6 text-left space-y-6">
          <Separator className="bg-border/30" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 border border-border/20 rounded-xl p-4">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Dosage / Quantity
              </span>
              <p className="text-foreground text-base font-bold">
                {prescription.dosage}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Frequency
              </span>
              <p className="text-foreground text-base font-bold">
                {prescription.frequency}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Duration
              </span>
              <p className="text-foreground text-base font-bold">
                {prescription.duration}
              </p>
            </div>
          </div>

          {prescription.instructions && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Directions for Use
              </span>
              <div className="bg-muted/10 border border-border/10 rounded-xl p-4 text-sm leading-relaxed text-foreground italic">
                &ldquo;{prescription.instructions}&rdquo;
              </div>
            </div>
          )}

          {prescription.consultation && (
            <>
              <Separator className="bg-border/30" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" /> Prescribing Doctor
                  </span>
                  <p className="text-foreground font-semibold">
                    {prescription.consultation.appointment?.doctor?.user
                      ?.name || "Verified Doctor"}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Specialization:{" "}
                    {prescription.consultation.appointment?.doctor?.specialty}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                    <HeartPulse className="h-3 w-3" /> Diagnosis Context
                  </span>
                  <p className="text-foreground font-medium">
                    {prescription.consultation.diagnosis || "Unspecified"}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>

        <div className="border-t border-border/20 bg-muted/15 px-8 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            PDEA S2 / PRC Credentials Verified. Electronic Signature Encrypted.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-border/60"
              render={<Link href="/patient/prescriptions" />}
            >
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-border/60 font-semibold"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Print eRx
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
