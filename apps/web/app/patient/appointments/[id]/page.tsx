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
import { Separator } from "@workspace/ui/components/separator"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  User,
  Video,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useAppointment, useCancelAppointment } from "@/hooks/use-appointments"
import { useJoinRoom } from "@/hooks/use-video"
import "@livekit/components-styles"

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // Video session states
  const [activeCallToken, setActiveCallToken] = useState<string | null>(null)
  const [activeCallUrl, setActiveCallUrl] = useState<string | null>(null)

  // 1. Fetch appointment details (react-query)
  const { data: appt, isPending, error, refetch } = useAppointment(id)

  // 2. Cancel mutation
  const cancelMutation = useCancelAppointment()

  // 3. Join video room mutation
  const joinRoomMutation = useJoinRoom()

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
            setActiveCallToken(data.token)
            setActiveCallUrl(data.url)
            toast.success("Joined video room!")
            refetch()
          } else {
            toast.error(
              "Invalid token payload returned from video room service",
            )
          }
        },
        onError: (err: any) => {
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
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    toast.loading("Processing cancellation...", { id: "cancel-appt" })

    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Appointment successfully cancelled", {
          id: "cancel-appt",
        })
        refetch()
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to cancel appointment", {
          id: "cancel-appt",
        })
      },
    })
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
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-semibold animate-pulse">
            Retrieving appointment details...
          </p>
        </div>
      </div>
    )
  }

  if (error || !appt) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto my-12">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <div className="space-y-1 text-left">
          <h3 className="font-semibold text-sm">
            Failed to retrieve appointment
          </h3>
          <p className="text-xs text-destructive/80 leading-relaxed">
            {error?.message ||
              "This appointment details could not be found or you do not have permission to view it."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/patient/appointments")}
            className="text-xs mt-3 h-8 border-destructive/20 hover:bg-destructive/10"
          >
            Back to appointments
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

  const isCancellable = appt.status === "BOOKED" || appt.status === "CONFIRMED"
  const isJoinable =
    appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS"

  // Render WebRTC Video Calling Screen directly if call is active
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
              Live consultation session with {appt.doctor.user.name}
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="text-xs h-8 font-semibold shadow-xs"
            onClick={() => {
              setActiveCallToken(null)
              setActiveCallUrl(null)
              toast.info("Left the consultation room.")
              refetch()
            }}
          >
            Leave Consultation Room
          </Button>
        </div>

        {/* LiveKit Calling Container */}
        <div className="h-[70vh] rounded-2xl border border-border/50 bg-black overflow-hidden relative shadow-2xl">
          <LiveKitRoom
            video={true}
            audio={true}
            token={activeCallToken}
            serverUrl={activeCallUrl}
            onDisconnected={() => {
              setActiveCallToken(null)
              setActiveCallUrl(null)
              refetch()
            }}
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
    <div className="space-y-6">
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
          <p className="text-[10px] text-muted-foreground">
            Appointment ID: {appt.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Details Card */}
        <Card className="lg:col-span-2 border border-border/40 bg-card shadow-sm text-left">
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
                {appt.type} Consultation
              </span>
            </div>
            <CardTitle className="text-xl font-bold mt-3">
              Consultation with {appt.doctor.user.name}
            </CardTitle>
            <CardDescription className="text-xs font-semibold">
              Specialization: {appt.doctor.specialty}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
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
          </CardContent>

          <CardFooter className="border-t border-border/15 py-4 px-6 flex justify-end gap-3 flex-wrap">
            {isCancellable && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 border-border/60 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                disabled={cancelMutation.isPending}
                onClick={handleCancel}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Cancel Appointment
              </Button>
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
                    <Loader2 className="h-4 w-4 animate-spin" />
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
          </CardFooter>
        </Card>

        {/* Doctor Summary Sidebar Card */}
        <div className="space-y-6">
          <Card className="border border-border/40 bg-card shadow-sm text-left">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                Doctor Specialist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase text-sm">
                  {appt.doctor.user.name?.[0] || appt.doctor.user.email?.[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {appt.doctor.user.name}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="text-[10px] mt-0.5 leading-none"
                  >
                    {appt.doctor.specialty}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Consultation Price:</span>
                  <strong className="text-foreground text-sm font-bold">
                    {formatPrice(Number(appt.doctor.pricePerVisit))}
                  </strong>
                </div>
                {(appt.doctor as any).clinicAddress && (
                  <div className="space-y-1">
                    <span>Clinic Address:</span>
                    <p className="text-foreground font-medium text-right truncate">
                      {(appt.doctor as any).clinicAddress}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* DPA Info Card */}
          <Card className="border border-border/40 bg-muted/20 shadow-xs text-left">
            <CardContent className="pt-6 space-y-3">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                Data Protection Verified
              </h4>
              <p className="text-[10px] text-muted-foreground leading-normal">
                This consultation operates in strict compliance with RA 10173.
                Communication channels and video calling are encrypted in
                transit and secured with WebRTC protocols via self-hosted
                LiveKit relays.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
