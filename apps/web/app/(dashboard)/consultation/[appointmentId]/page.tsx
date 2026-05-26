"use client"

import { LiveKitRoom, VideoConference } from "@livekit/components-react"
import "@livekit/components-styles"
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
  AlertCircle,
  Loader2,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useAppointment } from "@/hooks/use-appointments"
import { useEndRoom, useJoinRoom } from "@/hooks/use-video"

// ── Date formatting ───────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "full",
})

const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  timeStyle: "short",
  hour12: true,
})

// ── Page ──────────────────────────────────────────────────────────────────

export default function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const router = useRouter()
  const [appointmentId, setAppointmentId] = useState<string>("")
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Unwrap params promise (Next.js 16 async params)
  useEffect(() => {
    params.then((p) => setAppointmentId(p.appointmentId))
  }, [params])

  // Session
  const { data: session } = authClient.useSession()
  const user = session?.user as
    | { name?: string | null; email: string; role?: string | null }
    | undefined
  const role = user?.role ?? "PATIENT"
  const isPatient = role === "PATIENT"

  // Queries & mutations
  const { data: appointment, isPending: appointmentLoading } =
    useAppointment(appointmentId)
  const joinRoom = useJoinRoom()
  const endRoom = useEndRoom()

  // ── Join handler ────────────────────────────────────────────────────────
  const handleJoin = useCallback(() => {
    if (!appointmentId) return
    joinRoom.mutate(
      { appointmentId },
      {
        onSuccess: (data) => {
          setToken(data.token)
          setServerUrl(data.url)
        },
      },
    )
  }, [appointmentId, joinRoom])

  // ── Disconnect handler ──────────────────────────────────────────────────
  const handleDisconnect = useCallback(() => {
    if (!appointmentId) return
    endRoom.mutate(
      { appointmentId },
      {
        onSettled: () => {
          setToken(null)
          setServerUrl(null)
          setIsConnected(false)
          router.push(isPatient ? "/medical-records" : "/appointments")
        },
      },
    )
  }, [appointmentId, endRoom, isPatient, router])

  // ── LiveKit callbacks ───────────────────────────────────────────────────
  const onConnected = useCallback(() => {
    setIsConnected(true)
  }, [])

  const onDisconnected = useCallback(() => {
    handleDisconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDisconnect])

  // ── Error state ─────────────────────────────────────────────────────────
  if (joinRoom.isError) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <Card className="max-w-md w-full border-destructive/30 shadow-lg">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <VideoOff className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-lg">Failed to Join Consultation</CardTitle>
            <CardDescription className="text-sm">
              {(joinRoom.error as Error)?.message ||
                "An unexpected error occurred while connecting to the video room. Please try again."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleJoin}
              disabled={joinRoom.isPending}
              className="w-full gap-2"
            >
              {joinRoom.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(isPatient ? "/medical-records" : "/appointments")
              }
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Active call ─────────────────────────────────────────────────────────
  if (token && serverUrl) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/40">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {appointment
                ? `Consultation with ${isPatient ? appointment.doctor.user.name || "Doctor" : appointment.patient.name || "Patient"}`
                : "Video Consultation"}
            </span>
            {isConnected && (
              <Badge
                variant="default"
                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 text-[10px] h-5"
              >
                Live
              </Badge>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleDisconnect}
            disabled={endRoom.isPending}
          >
            {endRoom.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PhoneOff className="h-3.5 w-3.5" />
            )}
            End Call
          </Button>
        </div>

        {/* LiveKit room */}
        <div className="flex-1">
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            onConnected={onConnected}
            onDisconnected={onDisconnected}
            data-lk-theme="default"
            style={{ height: "100%" }}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>
      </div>
    )
  }

  // ── Pre-join UI ─────────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="max-w-md w-full border-border/40 shadow-lg">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Video className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-lg">Video Consultation</CardTitle>
          {appointment && (
            <CardDescription className="text-sm space-y-1">
              <span className="block">
                {isPatient
                  ? `Dr. ${appointment.doctor.user.name || "Doctor"}`
                  : appointment.patient.name || "Patient"}
              </span>
              {appointment.doctor.specialty && isPatient && (
                <span className="block text-xs text-muted-foreground/70">
                  {appointment.doctor.specialty}
                </span>
              )}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Appointment details */}
          {appointmentLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {appointment && (
            <div className="space-y-2 rounded-lg bg-muted/40 border border-border/30 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Video className="h-3.5 w-3.5" />
                <span>Video Call</span>
              </div>
              <div className="text-sm font-medium text-foreground">
                {dateFormatter.format(new Date(appointment.startTime))}
              </div>
              <div className="text-xs text-muted-foreground">
                {timeFormatter.format(new Date(appointment.startTime))} &ndash;{" "}
                {timeFormatter.format(new Date(appointment.endTime))}
              </div>
              {appointment.reason && (
                <p className="text-xs text-muted-foreground/80 leading-relaxed pt-1">
                  {appointment.reason}
                </p>
              )}
              <div className="pt-1">
                <Badge
                  variant="default"
                  className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 text-[10px] h-5"
                >
                  {appointment.status === "IN_PROGRESS"
                    ? "In Progress"
                    : "Confirmed"}
                </Badge>
              </div>
            </div>
          )}

          {/* Camera & mic notice */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/15 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Make sure your camera and microphone are enabled before joining.
              You can adjust permissions in your browser settings.
            </span>
          </div>

          {/* Join button */}
          <Button
            onClick={handleJoin}
            disabled={joinRoom.isPending || !appointmentId}
            className="w-full gap-2 shadow-md shadow-primary/10 hover:shadow-lg transition-all"
            size="lg"
          >
            {joinRoom.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Join Consultation
              </>
            )}
          </Button>

          {/* Back button */}
          <Button
            variant="outline"
            onClick={() =>
              router.push(isPatient ? "/medical-records" : "/appointments")
            }
            className="w-full"
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
