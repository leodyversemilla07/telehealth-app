"use client"

import type { AvailableSlotDto } from "@workspace/shared"
import dynamic from "next/dynamic"

const LiveKitRoom = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.LiveKitRoom),
  { ssr: false },
)
const VideoConference = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.VideoConference),
  { ssr: false },
)

import { useRemoteParticipants } from "@livekit/components-react"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
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
import { DatePicker } from "@workspace/ui/components/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  User,
  Video,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ErrorAlert } from "@/components/error-alert"
import { StatusBadge } from "@/components/status-badge"
import { TimeSlotPicker } from "@/components/time-slot-picker"
import {
  useAppointment,
  useAvailableSlots,
  useCancelAppointment,
  useRescheduleAppointment,
} from "@/hooks/use-appointments"
import { useAppointmentConsultation } from "@/hooks/use-records"
import { useCheckReview, useCreateReview } from "@/hooks/use-reviews"
import { useJoinRoom } from "@/hooks/use-video"
import "@livekit/components-styles"

// F-CONSULT-03: Show a waiting overlay until the doctor connects.
function DoctorWaitingOverlay() {
  const remoteParticipants = useRemoteParticipants()
  if (remoteParticipants.length > 0) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="text-center text-white">
        <Video className="mx-auto mb-4 size-12 text-primary" />
        <h3 className="text-lg font-bold">Waiting for doctor</h3>
        <p className="mt-2 text-sm text-white/70">
          Your doctor will join the consultation shortly
        </p>
      </div>
    </div>
  )
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // Video session states — persist across refreshes
  const [activeCallToken, setActiveCallToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`call-token-${id}`)
    }
    return null
  })
  const [activeCallUrl, setActiveCallUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`call-url-${id}`)
    }
    return null
  })

  // Wrapper functions that persist to sessionStorage
  const saveCallToken = (token: string | null) => {
    setActiveCallToken(token)
    if (token) {
      sessionStorage.setItem(`call-token-${id}`, token)
    } else {
      sessionStorage.removeItem(`call-token-${id}`)
    }
  }
  const saveCallUrl = (url: string | null) => {
    setActiveCallUrl(url)
    if (url) {
      sessionStorage.setItem(`call-url-${id}`, url)
    } else {
      sessionStorage.removeItem(`call-url-${id}`)
    }
  }

  // Reschedule states
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleSlot, setRescheduleSlot] = useState<AvailableSlotDto | null>(
    null,
  )

  // Review states
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")

  // Cancel confirmation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // 1. Fetch appointment details (react-query)
  const { data: appt, isPending, error, refetch } = useAppointment(id)

  // 2. Fetch consultation record (if appointment is completed)
  const { data: consultation } = useAppointmentConsultation(
    appt?.status === "COMPLETED" ? id : "",
  )

  // 2b. Check if patient has reviewed this appointment
  const { data: reviewCheck } = useCheckReview(
    appt?.status === "COMPLETED" ? id : "",
  )
  const createReviewMutation = useCreateReview()

  // 3. Cancel mutation
  const cancelMutation = useCancelAppointment()

  // 4. Reschedule mutation
  const rescheduleMutation = useRescheduleAppointment()

  // 5. Join video room mutation
  const joinRoomMutation = useJoinRoom()

  // 6. Fetch available slots for reschedule
  const { data: rescheduleSlots = [], isPending: slotsLoading } =
    useAvailableSlots(appt?.doctorId ?? "", rescheduleDate)

  // Handle Join Session
  const handleJoinCall = () => {
    toast.loading("Initiating secure video consultation room...", {
      id: "video-join",
    })

    joinRoomMutation.mutate(
      { appointmentId: id },
      {
        onSuccess: (data) => {
          toast.dismiss("video-join")
          if (data.token && data.url) {
            saveCallToken(data.token)
            saveCallUrl(data.url)
            toast.success("Joined video room!")
          } else {
            toast.error(
              "Invalid token payload returned from video room service",
            )
          }
        },
        onError: (err: Error) => {
          toast.dismiss("video-join")
          toast.error(
            err.message ||
              "Failed to initialize LiveKit room. Verify configurations.",
          )
        },
      },
    )
  }

  // Handle Cancel Session
  const handleCancel = () => {
    setShowCancelDialog(false)
    toast.loading("Processing cancellation...", { id: "cancel-appt" })

    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Appointment successfully cancelled", {
          id: "cancel-appt",
        })
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to cancel appointment", {
          id: "cancel-appt",
        })
      },
    })
  }

  // Handle Submit Review
  const handleSubmitReview = () => {
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Please select a rating between 1 and 5")
      return
    }

    toast.loading("Submitting review...", { id: "review" })

    createReviewMutation.mutate(
      {
        appointmentId: id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Review submitted successfully!", { id: "review" })
          setReviewRating(5)
          setReviewComment("")
        },
        onError: (err: { message?: string }) => {
          toast.error(err.message || "Failed to submit review", {
            id: "review",
          })
        },
      },
    )
  }

  // Handle Reschedule
  const handleReschedule = () => {
    if (!rescheduleSlot) {
      toast.error("Please select a new time slot")
      return
    }

    toast.loading("Rescheduling appointment...", { id: "reschedule-appt" })

    rescheduleMutation.mutate(
      {
        id,
        startTime: rescheduleSlot.startTime,
        endTime: rescheduleSlot.endTime,
      },
      {
        onSuccess: () => {
          toast.success("Appointment rescheduled successfully", {
            id: "reschedule-appt",
          })
          setShowRescheduleDialog(false)
          setRescheduleDate("")
          setRescheduleSlot(null)
          refetch()
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to reschedule", {
            id: "reschedule-appt",
          })
        },
      },
    )
  }

  // Format price helper (PHP currency ₱)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-10 text-primary" />
          <p className="text-muted-foreground text-sm font-semibold animate-pulse">
            Retrieving appointment details...
          </p>
        </div>
      </div>
    )
  }

  if (error || !appt) {
    return (
      <ErrorAlert
        title="Failed to retrieve appointment"
        description={
          error?.message ||
          "This appointment details could not be found or you do not have permission to view it."
        }
        actionLabel="Back to appointments"
        onAction={() => router.push("/patient/appointments")}
        className="my-12"
      />
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

  const isCancellable = appt.status === "BOOKED" || appt.status === "CONFIRMED"
  const isJoinable =
    appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS"

  // Render WebRTC Video Calling Screen directly if call is active
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
              Live consultation session with {appt.doctor?.user?.name}
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="text-xs h-8 font-semibold shadow-xs"
            onClick={() => {
              saveCallToken(null)
              saveCallUrl(null)
              toast.info("Left the consultation room.")
              // F-CONSULT-05: Redirect to post-visit appointments list
              router.push("/patient/appointments")
            }}
          >
            Leave Consultation Room
          </Button>
        </div>

        {/* LiveKit Calling Container */}
        <div className="relative h-[70vh] rounded-2xl border border-border/50 bg-black overflow-hidden shadow-2xl">
          <LiveKitRoom
            token={activeCallToken}
            serverUrl={activeCallUrl}
            connect
            audio
            video
            onDisconnected={() => {
              saveCallToken(null)
              saveCallUrl(null)
              // F-CONSULT-05: Redirect to post-visit appointments list
              router.push("/patient/appointments")
            }}
            data-lk-theme="default"
            className="h-full w-full"
          >
            {/* F-CONSULT-03: Show waiting overlay until doctor joins */}
            <DoctorWaitingOverlay />
            <VideoConference />
          </LiveKitRoom>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Premium Header */}
      <div className="flex items-center gap-3 text-left">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/patient/appointments")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <span className="font-bold tracking-tight text-sm text-foreground flex items-center gap-1.5">
            Appointment Details
          </span>
          <p className="text-xs text-muted-foreground">
            Appointment ID: {appt.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Details Card */}
        <Card className="lg:col-span-2 text-left">
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <StatusBadge status={appt.status} />
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                {appt.type === "VIDEO" && <Video className="h-3.5 w-3.5" />}
                {appt.type === "PHONE" && <Phone className="h-3.5 w-3.5" />}
                {appt.type === "IN_PERSON" && (
                  <MapPin className="h-3.5 w-3.5" />
                )}
                {appt.type} Consultation
              </span>
            </div>
            <CardTitle className="text-xl font-bold mt-3">
              Consultation with {appt.doctor?.user?.name}
            </CardTitle>
            <CardDescription className="text-xs font-semibold">
              Specialization: {appt.doctor?.specialty}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <Separator className="bg-border/30" />

            {/* Time details in PHT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 border border-border/20 rounded-xl p-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Date
                </span>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {dateStr}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Scheduled Slot (PHT Timezone)
                </span>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {timeStr} — {endTimeStr}
                </p>
              </div>
            </div>

            {/* Intake forms summaries */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Reason for Visit
                </span>
                <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 text-sm leading-relaxed text-foreground">
                  {appt.reason || "No summary provided."}
                </div>
              </div>

              {appt.symptoms && (
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    Symptom Intake Description
                  </span>
                  <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 text-sm leading-relaxed italic text-foreground/90">
                    &ldquo;{appt.symptoms}&rdquo;
                  </div>
                </div>
              )}
            </div>

            {/* Consultation Record (if completed) */}
            {appt.status === "COMPLETED" && consultation && (
              <>
                <Separator className="bg-border/30" />
                <div className="space-y-4">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5" /> Consultation
                    Record
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/20 border border-border/20 rounded-xl p-4 space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Diagnosis
                      </span>
                      <p className="text-foreground font-medium text-sm">
                        {consultation.diagnosis || "Not specified"}
                      </p>
                    </div>
                    {consultation.plan && (
                      <div className="bg-muted/20 border border-border/20 rounded-xl p-4 space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                          Treatment Plan
                        </span>
                        <p className="text-foreground text-sm">
                          {consultation.plan}
                        </p>
                      </div>
                    )}
                  </div>

                  {consultation.doctorNotes && (
                    <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 text-sm leading-relaxed text-foreground italic space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider not-italic">
                        Doctor&apos;s Notes
                      </span>
                      <p className="mt-1">
                        &ldquo;{consultation.doctorNotes}&rdquo;
                      </p>
                    </div>
                  )}

                  {consultation.prescriptions?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Prescriptions ({consultation.prescriptions?.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {consultation.prescriptions?.map((rx) => (
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="border-t border-border/15 py-4 px-6 flex justify-end gap-3 flex-wrap">
            {appt.status === "COMPLETED" ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 border-border/60"
                onClick={() => router.push("/patient/records")}
              >
                <ClipboardList className="h-4 w-4 mr-1.5" />
                View Full Medical Record
              </Button>
            ) : (
              <>
                {isCancellable && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 border-border/60 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                      disabled={cancelMutation.isPending}
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 border-border/60"
                      onClick={() => {
                        setRescheduleDate(
                          new Date().toISOString().split("T")[0] ?? "",
                        )
                        setShowRescheduleDialog(true)
                      }}
                    >
                      <CalendarClock className="h-4 w-4 mr-1.5" />
                      Reschedule
                    </Button>
                  </>
                )}

                {isJoinable && (
                  <Button
                    size="sm"
                    className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                    disabled={joinRoomMutation.isPending}
                    onClick={handleJoinCall}
                  >
                    {joinRoomMutation.isPending ? (
                      <>
                        <Spinner className="size-4" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        Join Consultation Room
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        </Card>

        {/* Reschedule Dialog */}
        <Dialog
          open={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Reschedule Appointment
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select a new date and time slot for your consultation with{" "}
                <strong>{appt.doctor?.user?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">New Date</Label>
                <DatePicker
                  id="reschedule-date"
                  min={new Date().toISOString().split("T")[0]}
                  value={rescheduleDate}
                  onChange={(val) => {
                    setRescheduleDate(val)
                    setRescheduleSlot(null)
                  }}
                  placeholder="Pick a date"
                />
              </div>

              <div className="space-y-2">
                <Label>New Time Slot</Label>
                <TimeSlotPicker
                  slots={rescheduleSlots}
                  selectedSlot={rescheduleSlot}
                  onSelect={setRescheduleSlot}
                  isLoading={slotsLoading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRescheduleDialog(false)
                  setRescheduleDate("")
                  setRescheduleSlot(null)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!rescheduleSlot || rescheduleMutation.isPending}
                onClick={handleReschedule}
              >
                {rescheduleMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5" />
                    Rescheduling...
                  </>
                ) : (
                  "Confirm Reschedule"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this appointment with{" "}
                <strong>{appt.doctor?.user?.name}</strong>? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelMutation.isPending}
              >
                Keep Appointment
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Doctor Summary Sidebar Card */}
        <div className="space-y-6">
          <Card className="text-left">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                Doctor Specialist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-center">
                <Avatar className="border border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase text-sm">
                    {appt.doctor?.user?.name?.[0] ||
                      appt.doctor?.user?.email?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {appt.doctor?.user?.name}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="text-xs mt-0.5 leading-none"
                  >
                    {appt.doctor?.specialty}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Consultation Price:</span>
                  <strong className="text-foreground text-sm font-bold">
                    {formatPrice(Number(appt.doctor?.pricePerVisit) || 0)}
                  </strong>
                </div>
                {appt.doctor?.clinicAddress && (
                  <div className="space-y-1">
                    <span>Clinic Address:</span>
                    <p className="text-foreground font-medium text-right truncate">
                      {appt.doctor?.clinicAddress}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* DPA Info Card */}
          <Card className="bg-muted/20 shadow-xs text-left">
            <CardContent className="pt-6 space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                Data Protection Verified
              </h4>
              <p className="text-xs text-muted-foreground leading-normal">
                This consultation operates in strict compliance with RA 10173.
                Communication channels and video calling are encrypted in
                transit and secured with WebRTC protocols via self-hosted
                LiveKit relays.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Review Section (only for completed appointments) */}
        {appt.status === "COMPLETED" && (
          <div className="space-y-4">
            {reviewCheck?.hasReviewed ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>You have already reviewed this consultation.</span>
                  </div>
                  {reviewCheck.review && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (reviewCheck.review?.rating ?? 0)
                                ? "text-amber-400 fill-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          {reviewCheck.review?.rating}/5
                        </span>
                      </div>
                      {reviewCheck.review?.comment && (
                        <p className="text-sm text-muted-foreground">
                          {reviewCheck.review?.comment}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      Rate Your Consultation
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Share your experience with Dr. {appt.doctor?.user?.name}
                    </p>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="hover:bg-transparent"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= reviewRating
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted-foreground hover:text-amber-200"
                          }`}
                        />
                      </Button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {reviewRating}/5
                    </span>
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <Label htmlFor="review-comment" className="text-xs">
                      Comments (optional)
                    </Label>
                    <Textarea
                      id="review-comment"
                      placeholder="How was your consultation experience?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSubmitReview}
                    disabled={createReviewMutation.isPending}
                  >
                    {createReviewMutation.isPending ? (
                      <>
                        <Spinner className="mr-2 size-4" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
