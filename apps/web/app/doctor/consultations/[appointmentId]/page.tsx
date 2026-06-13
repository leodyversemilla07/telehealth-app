"use client"

import dynamic from "next/dynamic"

const LiveKitRoom = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.LiveKitRoom),
  { ssr: false },
)
const VideoConference = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.VideoConference),
  { ssr: false },
)

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@workspace/ui/components/item"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  HeartPulse,
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
import { StatusBadge } from "@/components/status-badge"
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

const printStyles = `
  @media print {
    body * { visibility: hidden; }
    .print:block, .print:block * { visibility: visible !important; }
    .print:block { position: absolute; left: 0; top: 0; width: 100%; }
    .print:p-8 { padding: 2rem; }
    .print:text-black { color: #000; }
    .print:bg-white { background: #fff; }
    @page { margin: 1cm; size: A4; }
  }
`

export default function DoctorConsultationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.appointmentId as string

  // Video calling states — persist across refreshes
  const [activeCallToken, setActiveCallToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`call-token-${appointmentId}`)
    }
    return null
  })
  const [activeCallUrl, setActiveCallUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`call-url-${appointmentId}`)
    }
    return null
  })
  const [hasEndedCall, setHasEndedCall] = useState(false)

  // Wrapper functions that persist to sessionStorage
  const saveCallToken = (token: string | null) => {
    setActiveCallToken(token)
    if (token) {
      sessionStorage.setItem(`call-token-${appointmentId}`, token)
    } else {
      sessionStorage.removeItem(`call-token-${appointmentId}`)
    }
  }
  const saveCallUrl = (url: string | null) => {
    setActiveCallUrl(url)
    if (url) {
      sessionStorage.setItem(`call-url-${appointmentId}`, url)
    } else {
      sessionStorage.removeItem(`call-url-${appointmentId}`)
    }
  }

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

  // Finalize confirmation dialog state
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)

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
          saveCallToken(null)
          saveCallUrl(null)
          setHasEndedCall(true)
          toast.success("Consultation room closed successfully.")
          refetchAppt()
        },
        onError: (err: Error) => {
          toast.dismiss("video-end-doc")
          // Fallback cleanup of local state so the doctor is not stuck
          saveCallToken(null)
          saveCallUrl(null)
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
            saveCallToken(data.token)
            saveCallUrl(data.url)
            toast.success("Admitted to virtual consult room!")
            refetchAppt()
          } else {
            toast.error(
              "Invalid token signature returned from room token authority",
            )
          }
        },
        onError: (err: Error) => {
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

    setShowFinalizeDialog(true)
  }

  // Execute chart finalization after confirmation
  const handleConfirmFinalize = async () => {
    setShowFinalizeDialog(false)
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
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to finalize consultation chart."
      toast.error(message, {
        id: "chart-sub",
      })
    }
  }

  if (apptLoading || recordLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-10 w-10 text-primary" />
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

  const isCompleted = !!consultationRecord && !!consultationRecord.id
  const isJoinable =
    appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS"

  // ─────────────────────────────────────────────────────────────
  // RENDER: WebRTC Video calling screen (fullscreen mode)
  // ─────────────────────────────────────────────────────────────
  if (activeCallToken && activeCallUrl) {
    return (
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Call bar */}
        <div className="flex items-center justify-between bg-card border border-border/40 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-bold text-sm text-foreground">
              Live consultation session with {appt.patient?.name}
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
            token={activeCallToken}
            serverUrl={activeCallUrl}
            connect
            audio
            video
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
    <>
      <style>{printStyles}</style>
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Separator orientation="vertical" className="h-6" />
          <div className="truncate">
            <span className="font-bold tracking-tight text-sm text-foreground flex items-center gap-1.5">
              Clinical Consultation Room
            </span>
            <p className="text-xs text-muted-foreground truncate">
              Patient ID: {appt.patient?.id} | Consult Ref: {appt.id}
            </p>
          </div>
        </div>

        {/* Main Grid: Left Side Webrtc/Status, Right Side SOAP Charting */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Virtual Room or Overview (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Patient Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <StatusBadge status={appt.status} />
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    {appt.type === "VIDEO" && <Video className="h-3.5 w-3.5" />}
                    {appt.type === "PHONE" && <Phone className="h-3.5 w-3.5" />}
                    {appt.type === "IN_PERSON" && (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                    {appt.type} Session
                  </span>
                </div>
                <CardTitle className="text-lg font-bold mt-3">
                  Patient: {appt.patient?.name}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-muted-foreground">
                  Email: {appt.patient?.email}
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
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      Reason for Consult
                    </span>
                    <div className="bg-muted/10 border border-border/20 rounded-lg p-2.5 leading-relaxed">
                      {appt.reason || "No summary provided."}
                    </div>
                  </div>

                  {appt.symptoms && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Patient Reported Symptoms
                      </span>
                      <div className="bg-muted/10 border border-border/20 rounded-lg p-2.5 leading-relaxed italic">
                        &ldquo;{appt.symptoms}&rdquo;
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verification compliant note */}
            <Item variant="muted" size="sm">
              <ItemContent>
                <ItemTitle className="flex items-center gap-1.5">
                  <ShieldCheck />
                  Data Privacy RA 10173 Approved
                </ItemTitle>
                <ItemDescription>
                  Consultation transcripts and visual sessions are securely
                  isolated in transit. Standardized medical charting documents
                  are encrypted and signed at rest.
                </ItemDescription>
              </ItemContent>
            </Item>
          </div>

          {/* Right Column: SOAP Charting or Read-only completed preview (Span 7) */}
          <div className="lg:col-span-7">
            {isCompleted ? (
              // ─────────────────────────────────────────────────────────────
              // COMPLETED CHART PREVIEW
              // ─────────────────────────────────────────────────────────────
              <>
                <Card className="border border-emerald-500/20 shadow-md">
                  <CardHeader className="border-b border-border/10 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-emerald-600" />
                        <CardTitle className="text-base font-bold text-success">
                          Signed EHR Clinical Chart
                        </CardTitle>
                      </div>
                      <Badge className="bg-success text-success-foreground font-bold text-xs">
                        SIGNED & FINALIZED
                      </Badge>
                    </div>
                    <CardDescription className="text-xs font-semibold">
                      This chart record is securely finalized and forms part of
                      the patient's permanent electronic health record (EHR).
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6 text-xs text-left">
                    {consultationRecord ? (
                      <>
                        {/* SOAP Fields */}
                        <div className="space-y-4.5">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                              Diagnostic Assessment (Diagnosis)
                            </span>
                            <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 text-sm font-bold text-foreground">
                              {consultationRecord.diagnosis ||
                                "No diagnosis logged."}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                              Doctor's Subjective & Objective Findings
                            </span>
                            <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 leading-relaxed whitespace-pre-wrap">
                              {consultationRecord.doctorNotes ||
                                "No notes logged."}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
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

                          {consultationRecord.prescriptions?.length === 0 ? (
                            <p className="text-muted-foreground text-xs italic">
                              No pharmacological agents were prescribed during
                              this consultation session.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {consultationRecord.prescriptions?.map((rx) => (
                                <div
                                  key={rx.id}
                                  className="border border-border/20 bg-muted/5 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                                >
                                  {/* R symbol signature watermark */}
                                  <span className="absolute -right-3 -bottom-4 text-6xl font-bold text-muted-foreground/5 pointer-events-none select-none italic font-serif">
                                    ℞
                                  </span>

                                  <div className="space-y-1 text-left">
                                    <h5 className="font-bold text-sm text-foreground flex items-center gap-1">
                                      <span className="text-primary italic font-serif">
                                        ℞
                                      </span>
                                      {rx.medicationName}
                                    </h5>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                      {rx.dosage} — {rx.frequency}
                                    </p>
                                    <p className="text-xs text-foreground font-semibold">
                                      Duration: {rx.duration}
                                    </p>
                                  </div>

                                  {rx.instructions && (
                                    <p className="text-xs text-muted-foreground bg-muted/20 border border-border/10 rounded-lg p-2 leading-relaxed">
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
                        <Spinner className="h-8 w-8 text-primary" />
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

                {/* ─── Print-only EHR Template ─────────────────────────────── */}
                {consultationRecord && (
                  <div className="hidden print:block print:p-8 print:text-black print:bg-white">
                    {/* Header */}
                    <div className="border-b-2 border-black pb-4 mb-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-xl font-bold">
                            TELEHEALTH PLATFORM
                          </h1>
                          <p className="text-xs text-gray-600">
                            Electronic Health Record (EHR)
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          <p>Printed: {new Date().toLocaleDateString()}</p>
                          <p>Record ID: {consultationRecord.id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Patient & Doctor Info */}
                    <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
                      <div>
                        <h3 className="font-bold text-sm border-b border-gray-300 pb-1 mb-2">
                          PATIENT INFORMATION
                        </h3>
                        <p>
                          <span className="font-semibold">Name:</span>{" "}
                          {appt.patient?.name}
                        </p>
                        <p>
                          <span className="font-semibold">Email:</span>{" "}
                          {appt.patient?.email}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm border-b border-gray-300 pb-1 mb-2">
                          CONSULTATION DETAILS
                        </h3>
                        <p>
                          <span className="font-semibold">Date:</span>{" "}
                          {new Date(appt.startTime).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-semibold">Time:</span>{" "}
                          {new Date(appt.startTime).toLocaleTimeString()} —{" "}
                          {new Date(appt.endTime).toLocaleTimeString()}
                        </p>
                        <p>
                          <span className="font-semibold">Type:</span>{" "}
                          {appt.type}
                        </p>
                        <p>
                          <span className="font-semibold">Status:</span>{" "}
                          {appt.status}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
                      <div>
                        <h3 className="font-bold text-sm border-b border-gray-300 pb-1 mb-2">
                          ATTENDING PHYSICIAN
                        </h3>
                        <p>
                          <span className="font-semibold">Doctor:</span>{" "}
                          {appt.doctor?.user?.name}
                        </p>
                        <p>
                          <span className="font-semibold">Specialty:</span>{" "}
                          {appt.doctor?.specialty}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm border-b border-gray-300 pb-1 mb-2">
                          REASON FOR CONSULT
                        </h3>
                        <p>{appt.reason || "Not specified"}</p>
                        {appt.symptoms && (
                          <p className="mt-1">
                            <span className="font-semibold">Symptoms:</span>{" "}
                            {appt.symptoms}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* SOAP Notes */}
                    <div className="mb-6 text-xs">
                      <h3 className="font-bold text-sm border-b border-gray-300 pb-1 mb-3">
                        CLINICAL ASSESSMENT
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-xs">DIAGNOSIS:</p>
                          <p className="border border-gray-300 rounded p-2 mt-1">
                            {consultationRecord.diagnosis || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-xs">
                            SUBJECTIVE & OBJECTIVE FINDINGS:
                          </p>
                          <p className="border border-gray-300 rounded p-2 mt-1 whitespace-pre-wrap">
                            {consultationRecord.doctorNotes || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-xs">
                            TREATMENT & RECOMMENDATION PLAN:
                          </p>
                          <p className="border border-gray-300 rounded p-2 mt-1 whitespace-pre-wrap">
                            {consultationRecord.plan || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prescriptions */}
                    {consultationRecord.prescriptions &&
                      consultationRecord.prescriptions.length > 0 && (
                        <div className="mb-6 text-xs">
                          <h3 className="font-bold text-sm border-b border-gray-300 pb-1 mb-3">
                            PRESCRIPTIONS
                          </h3>
                          <Table className="text-xs">
                            <TableHeader>
                              <TableRow className="bg-gray-100">
                                <TableHead className="h-auto border border-gray-300 p-1.5 text-left">
                                  Medication
                                </TableHead>
                                <TableHead className="h-auto border border-gray-300 p-1.5 text-left">
                                  Dosage
                                </TableHead>
                                <TableHead className="h-auto border border-gray-300 p-1.5 text-left">
                                  Frequency
                                </TableHead>
                                <TableHead className="h-auto border border-gray-300 p-1.5 text-left">
                                  Duration
                                </TableHead>
                                <TableHead className="h-auto border border-gray-300 p-1.5 text-left">
                                  Instructions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {consultationRecord.prescriptions.map((rx) => (
                                <TableRow key={rx.id}>
                                  <TableCell className="border border-gray-300 p-1.5 font-medium">
                                    {rx.medicationName}
                                  </TableCell>
                                  <TableCell className="border border-gray-300 p-1.5">
                                    {rx.dosage}
                                  </TableCell>
                                  <TableCell className="border border-gray-300 p-1.5">
                                    {rx.frequency}
                                  </TableCell>
                                  <TableCell className="border border-gray-300 p-1.5">
                                    {rx.duration}
                                  </TableCell>
                                  <TableCell className="border border-gray-300 p-1.5">
                                    {rx.instructions || "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                    {/* Footer */}
                    <div className="border-t-2 border-black pt-4 mt-8 text-xs text-gray-500">
                      <p>
                        This document is generated by the Telehealth Platform
                        EHR system.
                      </p>
                      <p>
                        Consultation transcripts and visual sessions are
                        securely isolated in transit.
                      </p>
                      <p className="mt-2">
                        Signature: ____________________________ Date:
                        ____________________
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : hasEndedCall ? (
              // ─────────────────────────────────────────────────────────────
              // ACTIVE SOAP CLINICAL CHARTING FORM (after call ended)
              // ─────────────────────────────────────────────────────────────
              <form onSubmit={handleSubmitChart}>
                <Card className="shadow-md">
                  <CardHeader className="px-6 pt-6 pb-4 border-b border-border/10">
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
                        className="bg-muted/10 border-border/60 text-xs min-h-25 leading-relaxed"
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
                        className="bg-muted/10 border-border/60 text-xs min-h-20 leading-relaxed"
                      />
                    </div>

                    <Separator className="bg-border/30" />

                    {/* E-Prescriptions Module */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                        <Pill className="h-4 w-4 text-primary" />
                        Dispense e-Prescription (eRx)
                      </h4>

                      {/* Medications list draft */}
                      {prescriptions.length > 0 && (
                        <div className="space-y-2 border border-border/20 rounded-xl p-3 bg-muted/10">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
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
                                  <p className="text-xs text-muted-foreground">
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
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                          Add Pharmacological Agent
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <Label
                              htmlFor="med-name"
                              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
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
                              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
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
                              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
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
                              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
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
                            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
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
                            className="text-xs h-7 font-bold flex items-center gap-1 shadow-sm px-3"
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
                      className="text-xs h-9 bg-primary hover:bg-primary/95 text-primary-foreground font-bold flex items-center gap-1.5 shadow-sm"
                      disabled={
                        createConsultationMutation.isPending ||
                        updateStatusMutation.isPending
                      }
                    >
                      {createConsultationMutation.isPending ||
                      updateStatusMutation.isPending ? (
                        <>
                          <Spinner className="h-3.5 w-3.5" />
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
            ) : (
              // ─────────────────────────────────────────────────────────────
              // BEFORE CALL: Prompt to start consultation
              // ─────────────────────────────────────────────────────────────
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">
                      Ready to Start Consultation
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Click &quot;Start Consultation&quot; to join the video
                      room with your patient. After the call ends, you can
                      document your findings here.
                    </p>
                  </div>
                  {isJoinable && (
                    <Button
                      size="sm"
                      className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                      disabled={joinRoomMutation.isPending}
                      onClick={handleJoinCall}
                    >
                      {joinRoomMutation.isPending ? (
                        <>
                          <Spinner className="h-3.5 w-3.5" />
                          Securing relays...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4" />
                          Start Consultation
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Finalize Confirmation Dialog */}
      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalize Clinical Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to finalize this clinical record? This will
              permanently close the session and sign the e-prescription ledger.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFinalizeDialog(false)}
              disabled={
                createConsultationMutation.isPending ||
                updateStatusMutation.isPending
              }
            >
              Review Again
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmFinalize}
              disabled={
                createConsultationMutation.isPending ||
                updateStatusMutation.isPending
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {createConsultationMutation.isPending ||
              updateStatusMutation.isPending
                ? "Signing..."
                : "Yes, Finalize Chart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
