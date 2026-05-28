"use client"

import { LiveKitRoom, VideoConference } from "@livekit/components-react"
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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
  Pill,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  Video,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  useAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments"
import {
  useAppointmentConsultation,
  useCreateConsultation,
} from "@/hooks/use-records"
import { useEndRoom, useJoinRoom } from "@/hooks/use-video"
import "@livekit/components-styles"

interface PrescriptionInput {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export default function DoctorConsultationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.appointmentId as string

  // Video calling states
  const [activeCallToken, setActiveCallToken] = useState<string | null>(null)
  const [activeCallUrl, setActiveCallUrl] = useState<string | null>(null)

  // Charting state
  const [diagnosis, setDiagnosis] = useState("")
  const [doctorNotes, setDoctorNotes] = useState("")
  const [plan, setPlan] = useState("")
  const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([])

  // Medication Builder State
  const [medName, setMedName] = useState("")
  const [medDosage, setMedDosage] = useState("")
  const [medFreq, setMedFreq] = useState("")
  const [medDur, setMedDur] = useState("")
  const [medInst, setMedInst] = useState("")

  // 1. Queries
  const {
    data: appt,
    isPending: apptLoading,
    error: apptError,
    refetch: refetchAppt,
  } = useAppointment(appointmentId)
  const {
    data: consultationRecord,
    isPending: recordLoading,
    refetch: refetchRecord,
  } = useAppointmentConsultation(appointmentId)

  // 2. Mutations
  const updateStatusMutation = useUpdateAppointmentStatus()
  const joinRoomMutation = useJoinRoom()
  const endRoomMutation = useEndRoom()
  const createConsultationMutation = useCreateConsultation()

  // Handle Video Calling End (F-CONSULT-06: Terminate room cleanly on server)
  const handleEndCall = () => {
    toast.loading("Terminating virtual consultation session...", {
      id: "video-end-doc",
    })
    endRoomMutation.mutate(
      { appointmentId },
      {
        onSuccess: () => {
          toast.dismiss("video-end-doc")
          setActiveCallToken(null)
          setActiveCallUrl(null)
          toast.success("Consultation room closed successfully.")
          refetchAppt()
        },
        onError: (err: any) => {
          toast.dismiss("video-end-doc")
          // Fallback cleanup of local state so the doctor is not stuck
          setActiveCallToken(null)
          setActiveCallUrl(null)
          toast.warning(err.message || "Cleaned up local connection state.")
          refetchAppt()
        },
      },
    )
  }

  // Handle Video Calling Init
  const handleJoinCall = () => {
    toast.loading("Initializing secure Webrtc room context...", {
      id: "video-join-doc",
    })

    joinRoomMutation.mutate(
      { appointmentId },
      {
        onSuccess: (data) => {
          toast.dismiss("video-join-doc")
          if (data.token && data.url) {
            setActiveCallToken(data.token)
            setActiveCallUrl(data.url)
            toast.success("Admitted to virtual consult room!")
            refetchAppt()
          } else {
            toast.error(
              "Invalid token signature returned from room token authority",
            )
          }
        },
        onError: (err: any) => {
          toast.dismiss("video-join-doc")
          toast.error(
            err.message || "Failed to initialize Webrtc relay connection",
          )
        },
      },
    )
  }

  // Medication Adding
  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault()
    if (!medName || !medDosage || !medFreq || !medDur) {
      toast.error(
        "Medication Name, Dosage, Frequency, and Duration are required",
      )
      return
    }

    const newRx: PrescriptionInput = {
      medicationName: medName.trim(),
      dosage: medDosage.trim(),
      frequency: medFreq.trim(),
      duration: medDur.trim(),
      instructions: medInst.trim() || undefined,
    }

    setPrescriptions((prev) => [...prev, newRx])
    setMedName("")
    setMedDosage("")
    setMedFreq("")
    setMedDur("")
    setMedInst("")
    toast.success("Medication added to draft chart")
  }

  // Medication Deleting
  const handleRemoveMedication = (idx: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx))
  }

  // Chart Submission (SOAP Charting + eRx)
  const handleSubmitChart = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!diagnosis) {
      toast.error("A diagnostic assessment is required before finalizing.")
      return
    }

    if (
      !confirm(
        "Are you sure you want to finalize this clinical record? This will permanently close the session and sign the e-prescription ledger.",
      )
    ) {
      return
    }

    toast.loading("Processing clinical signature...", { id: "chart-sub" })

    try {
      // 1. Transition Appointment to COMPLETED
      await updateStatusMutation.mutateAsync({
        id: appointmentId,
        status: "COMPLETED",
      })

      // 2. Submit SOAP notes and prescriptions
      await createConsultationMutation.mutateAsync({
        appointmentId,
        diagnosis: diagnosis.trim(),
        doctorNotes: doctorNotes.trim() || undefined,
        plan: plan.trim() || undefined,
        prescriptions: prescriptions.map((p) => ({
          medicationName: p.medicationName,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions,
        })),
      })

      toast.success("Clinical chart successfully signed and encrypted!", {
        id: "chart-sub",
      })
      refetchAppt()
      refetchRecord()
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize consultation chart.", {
        id: "chart-sub",
      })
    }
  }

  // Format Helper
  const _formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  if (apptLoading || recordLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-semibold animate-pulse">
            Retrieving clinical session context...
          </p>
        </div>
      </div>
    )
  }

  if (apptError || !appt) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto my-12 text-left">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <div className="space-y-1">
          <h3 className="font-semibold text-sm">
            Clinical Session Load Failure
          </h3>
          <p className="text-xs text-destructive/80 leading-relaxed">
            {apptError?.message ||
              "This appointment details could not be found or you do not have credentialed permissions to access it."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/doctor/consultations")}
            className="text-xs mt-3 h-8 border-destructive/20 hover:bg-destructive/10"
          >
            Back to queue
          </Button>
        </div>
      </div>
    )
  }

  const dateStr = new Date(appt.startTime).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  })

  const timeStr = new Date(appt.startTime).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })

  const endTimeStr = new Date(appt.endTime).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })

  const isCompleted = appt.status === "COMPLETED" || !!consultationRecord
  const isJoinable =
    appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS"

  // ─────────────────────────────────────────────────────────────
  // RENDER: WebRTC Video calling screen (fullscreen mode)
  // ─────────────────────────────────────────────────────────────
  if (activeCallToken && activeCallUrl) {
    return (
      <div className="space-y-4">
        {/* Call bar */}
        <div className="flex items-center justify-between bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-bold text-sm text-foreground">
              Live consultation session with {appt.patient.name}
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="text-xs h-8 font-semibold shadow-xs"
            onClick={handleEndCall}
          >
            Leave Calling Room
          </Button>
        </div>

        {/* LiveKit Calling Container */}
        <div className="h-[70vh] rounded-2xl border border-border/50 bg-black overflow-hidden relative shadow-2xl">
          <LiveKitRoom
            video={true}
            audio={true}
            token={activeCallToken}
            serverUrl={activeCallUrl}
            onDisconnected={handleEndCall}
            data-lk-theme="default"
            className="h-full w-full"
          >
            <VideoConference />
          </LiveKitRoom>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => router.push("/doctor/consultations")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="truncate">
          <span className="font-bold tracking-tight text-sm text-foreground flex items-center gap-1.5">
            Clinical Consultation Room
          </span>
          <p className="text-[10px] text-muted-foreground truncate">
            Patient ID: {appt.patient.id} | Consult Ref: {appt.id}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Side Webrtc/Status, Right Side SOAP Charting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Virtual Room or Overview (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patient Card */}
          <Card className="border border-border/40 bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs h-6 font-bold uppercase ${
                    appt.status === "CONFIRMED"
                      ? "text-emerald-600 border-emerald-200 bg-emerald-50/50"
                      : appt.status === "IN_PROGRESS"
                        ? "text-amber-600 border-amber-200 bg-amber-50/50"
                        : appt.status === "BOOKED"
                          ? "text-sky-600 border-sky-200 bg-sky-50/50"
                          : "text-muted-foreground"
                  }`}
                >
                  {appt.status}
                </Badge>
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  {appt.type === "VIDEO" && <Video className="h-3.5 w-3.5" />}
                  {appt.type === "PHONE" && <Phone className="h-3.5 w-3.5" />}
                  {appt.type === "IN_PERSON" && (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  {appt.type} Session
                </span>
              </div>
              <CardTitle className="text-lg font-black mt-3">
                Patient: {appt.patient.name}
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-muted-foreground">
                Email: {appt.patient.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <Separator className="bg-border/30" />

              {/* Localized Times */}
              <div className="space-y-2 bg-muted/20 border border-border/20 rounded-xl p-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">
                    Date:
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    {dateStr}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">
                    Scheduled:
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    {timeStr} — {endTimeStr}
                  </span>
                </div>
              </div>

              {/* Reason / Symptoms Intake */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Reason for Consult
                  </span>
                  <div className="bg-muted/10 border border-border/20 rounded-lg p-2.5 leading-relaxed">
                    {appt.reason || "No summary provided."}
                  </div>
                </div>

                {appt.symptoms && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Patient Reported Symptoms
                    </span>
                    <div className="bg-muted/10 border border-border/20 rounded-lg p-2.5 leading-relaxed italic">
                      &ldquo;{appt.symptoms}&rdquo;
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Admittance buttons */}
            {isJoinable && !isCompleted && (
              <CardFooter className="bg-muted/5 border-t border-border/10 p-4 flex justify-end">
                <Button
                  size="sm"
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm w-full"
                  disabled={joinRoomMutation.isPending}
                  onClick={handleJoinCall}
                >
                  {joinRoomMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Securing relays...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      Join Live Consultation Room
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Verification compliant note */}
          <Card className="border border-border/40 bg-muted/20 shadow-xs">
            <CardContent className="pt-5 space-y-2 text-xs">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                Data Privacy RA 10173 Approved
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Consultation transcripts and visual sessions are securely
                isolated in transit. Standardized medical charting documents are
                encrypted and signed at rest.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: SOAP Charting or Read-only completed preview (Span 7) */}
        <div className="lg:col-span-7">
          {isCompleted ? (
            // ─────────────────────────────────────────────────────────────
            // COMPLETED CHART PREVIEW
            // ─────────────────────────────────────────────────────────────
            <Card className="border border-emerald-500/20 bg-card shadow-md">
              <CardHeader className="bg-emerald-500/5 border-b border-border/10 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-base font-bold text-emerald-800">
                      Signed EHR Clinical Chart
                    </CardTitle>
                  </div>
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold text-[10px]">
                    SIGNED & FINALIZED
                  </Badge>
                </div>
                <CardDescription className="text-xs font-semibold">
                  This chart record is securely finalized and forms part of the
                  patient's permanent electronic health record (EHR).
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6 text-xs text-left">
                {consultationRecord ? (
                  <>
                    {/* SOAP Fields */}
                    <div className="space-y-4.5">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Diagnostic Assessment (Diagnosis)
                        </span>
                        <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 text-sm font-bold text-foreground">
                          {consultationRecord.diagnosis ||
                            "No diagnosis logged."}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Doctor's Subjective & Objective Findings
                        </span>
                        <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 leading-relaxed whitespace-pre-wrap">
                          {consultationRecord.doctorNotes || "No notes logged."}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Treatment & Recommendation Plan
                        </span>
                        <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 leading-relaxed whitespace-pre-wrap">
                          {consultationRecord.plan || "No plan logged."}
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* eRx display block */}
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Pill className="h-4 w-4 text-primary" />
                        Electronic Prescription Ledger (eRx)
                      </h4>

                      {consultationRecord.prescriptions.length === 0 ? (
                        <p className="text-muted-foreground text-xs italic">
                          No pharmacological agents were prescribed during this
                          consultation session.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {consultationRecord.prescriptions.map((rx) => (
                            <div
                              key={rx.id}
                              className="border border-border/20 bg-muted/5 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                            >
                              {/* R symbol signature watermark */}
                              <span className="absolute -right-3 -bottom-4 text-6xl font-black text-muted-foreground/5 pointer-events-none select-none italic font-serif">
                                ℞
                              </span>

                              <div className="space-y-1 text-left">
                                <h5 className="font-black text-sm text-foreground flex items-center gap-1">
                                  <span className="text-primary italic font-serif">
                                    ℞
                                  </span>
                                  {rx.medicationName}
                                </h5>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                  {rx.dosage} — {rx.frequency}
                                </p>
                                <p className="text-[10px] text-foreground font-semibold">
                                  Duration: {rx.duration}
                                </p>
                              </div>

                              {rx.instructions && (
                                <p className="text-[10px] text-muted-foreground bg-muted/20 border border-border/10 rounded-lg p-2 leading-relaxed">
                                  Instructions: {rx.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-xs animate-pulse">
                      Retrieving signature tokens from database ledger...
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t border-border/15 py-4 px-6 flex justify-end gap-3 bg-muted/5">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-9 border-border/60 flex items-center gap-1.5 font-bold"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  Print EHR Chart
                </Button>
              </CardFooter>
            </Card>
          ) : (
            // ─────────────────────────────────────────────────────────────
            // ACTIVE SOAP CLINICAL CHARTING FORM
            // ─────────────────────────────────────────────────────────────
            <form onSubmit={handleSubmitChart}>
              <Card className="border border-border/40 bg-card shadow-md">
                <CardHeader className="pb-4 border-b border-border/10">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-primary animate-pulse" />
                    <CardTitle className="text-base font-bold">
                      Clinical Charting Console
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Formulate diagnostic evaluations, SOAP notations, and
                    dispense medications directly.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6 text-xs text-left">
                  {/* Diagnosis */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="diagnosis"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Diagnostic Assessment (Diagnosis){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="diagnosis"
                      placeholder="e.g. Acute Pharyngitis with secondary tonsillar hyperplasia"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="bg-muted/10 border-border/60 text-sm font-semibold h-10"
                      required
                    />
                  </div>

                  {/* Doctor Notes SOAP */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="notes"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Subjective & Objective Findings (SOAP Findings)
                    </Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      placeholder="Subjective: Patient reports sore throat and pain on swallowing.&#10;Objective: Ertyhematous tonsillar pillars, no active exudates. Lungs clear."
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      className="bg-muted/10 border-border/60 text-xs min-h-[100px] leading-relaxed"
                    />
                  </div>

                  {/* Plan / Recommendation */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="plan"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Treatment Plan & Instructions
                    </Label>
                    <Textarea
                      id="plan"
                      rows={3}
                      placeholder="Increase oral fluid intake. Rest. Take medications as prescribed below. Follow up in 5 days if fever persists."
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="bg-muted/10 border-border/60 text-xs min-h-[80px] leading-relaxed"
                    />
                  </div>

                  <Separator className="bg-border/30" />

                  {/* E-Prescriptions Module */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <Pill className="h-4 w-4 text-primary" />
                      Dispense e-Prescription (eRx)
                    </h4>

                    {/* Medications list draft */}
                    {prescriptions.length > 0 && (
                      <div className="space-y-2 border border-border/20 rounded-xl p-3 bg-muted/10">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Drafted Prescriptions List ({prescriptions.length})
                        </Label>
                        <div className="space-y-2 divide-y divide-border/10">
                          {prescriptions.map((rx, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center pt-2 first:pt-0"
                            >
                              <div className="space-y-0.5">
                                <h5 className="font-bold text-foreground flex items-center gap-1">
                                  <span className="text-primary italic font-serif">
                                    ℞
                                  </span>
                                  {rx.medicationName} ({rx.dosage})
                                </h5>
                                <p className="text-[10px] text-muted-foreground">
                                  {rx.frequency} for {rx.duration}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => handleRemoveMedication(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medication Adder Form Grid */}
                    <div className="bg-muted/15 border border-border/10 rounded-xl p-4.5 space-y-3.5">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                        Add Pharmacological Agent
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <Label
                            htmlFor="med-name"
                            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            Medication Name
                          </Label>
                          <Input
                            id="med-name"
                            placeholder="e.g. Amoxicillin Trihydrate"
                            value={medName}
                            onChange={(e) => setMedName(e.target.value)}
                            className="bg-card h-8.5 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="med-dosage"
                            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            Dosage / Concentration
                          </Label>
                          <Input
                            id="med-dosage"
                            placeholder="e.g. 500mg"
                            value={medDosage}
                            onChange={(e) => setMedDosage(e.target.value)}
                            className="bg-card h-8.5 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="med-freq"
                            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            Frequency
                          </Label>
                          <Input
                            id="med-freq"
                            placeholder="e.g. Three times a day (TID)"
                            value={medFreq}
                            onChange={(e) => setMedFreq(e.target.value)}
                            className="bg-card h-8.5 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="med-dur"
                            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            Duration
                          </Label>
                          <Input
                            id="med-dur"
                            placeholder="e.g. 7 days"
                            value={medDur}
                            onChange={(e) => setMedDur(e.target.value)}
                            className="bg-card h-8.5 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="med-inst"
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          Specific Instructions (Optional)
                        </Label>
                        <Input
                          id="med-inst"
                          placeholder="e.g. Take with food or immediately after meals."
                          value={medInst}
                          onChange={(e) => setMedInst(e.target.value)}
                          className="bg-card h-8.5 text-xs"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleAddMedication}
                          className="text-[10px] h-7 font-bold flex items-center gap-1 shadow-sm px-3"
                        >
                          <Plus className="h-3 w-3" />
                          Add Medication
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border/15 py-4 px-6 flex justify-end bg-muted/5">
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs h-9 bg-primary hover:bg-primary/95 text-primary-foreground font-black flex items-center gap-1.5 shadow-sm"
                    disabled={
                      createConsultationMutation.isPending ||
                      updateStatusMutation.isPending
                    }
                  >
                    {createConsultationMutation.isPending ||
                    updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Signing & Encoding Chart...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        Complete & Submit Chart
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
