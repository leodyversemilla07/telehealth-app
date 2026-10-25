"use client"

import {
  useConnectionState,
  useRemoteParticipants,
} from "@livekit/components-react"
import { toast } from "@workspace/ui/components/toast"
import { ConnectionState } from "livekit-client"
import { MicOff, Video } from "lucide-react"
import dynamic from "next/dynamic"
import { useState } from "react"
import "@livekit/components-styles"

// LiveKit must not be evaluated on the server (it touches browser WebRTC APIs).
const LiveKitRoom = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.LiveKitRoom),
  { ssr: false },
)
const VideoConference = dynamic(
  () => import("@livekit/components-react").then((mod) => mod.VideoConference),
  { ssr: false },
)

export interface ConsultationRoomProps {
  /** LiveKit access token for this participant. */
  token: string
  /** LiveKit server URL (wss://…). */
  serverUrl: string
  /** Called when the room disconnects, locally or remotely. */
  onDisconnected: () => void
  /** Text shown while the other party has not joined yet. */
  waitingLabel: string
  /** "banner" (doctor view) or "overlay" (patient view). */
  waitingVariant?: "banner" | "overlay"
}

/**
 * Shared LiveKit room wrapper for the patient and doctor consultation screens.
 *
 * Owns the dynamic LiveKit imports, the in-room waiting indicator, and
 * graceful degradation (NFR-REL-02): if the camera is unavailable the call
 * continues audio-only instead of dropping, and a reconnecting transport is
 * surfaced to the user.
 *
 * IMPORTANT: every child rendered here lives inside <LiveKitRoom>, so
 * `useRemoteParticipants` / `useConnectionState` receive the room context.
 * (A waiting indicator rendered as a *sibling* of <LiveKitRoom> throws
 * "No room provided".)
 */
export function ConsultationRoom({
  token,
  serverUrl,
  onDisconnected,
  waitingLabel,
  waitingVariant = "banner",
}: ConsultationRoomProps) {
  const [audioOnly, setAudioOnly] = useState(false)

  const handleMediaDeviceFailure = (
    _failure: unknown,
    kind?: MediaDeviceKind, // DOM type: "audioinput" | "videoinput" | "audiooutput"
  ) => {
    // A missing camera must not end the consultation: audio keeps flowing
    // (LiveKit publishes whatever is available) and we tell the user why
    // their video is absent. Microphone failure is left to LiveKit's own UI.
    if (kind === "videoinput" && !audioOnly) {
      setAudioOnly(true)
      toast.add({
        title: "Camera unavailable — continuing with audio only.",
        type: "warning",
      })
    }
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video
      onDisconnected={onDisconnected}
      onMediaDeviceFailure={handleMediaDeviceFailure}
      data-lk-theme="default"
      className="h-full w-full"
    >
      <WaitingIndicator label={waitingLabel} variant={waitingVariant} />
      <ConnectionNotice />
      {audioOnly ? <AudioOnlyNotice /> : null}
      <VideoConference />
    </LiveKitRoom>
  )
}

interface WaitingIndicatorProps {
  label: string
  variant: "banner" | "overlay"
}

/** F-CONSULT-03: shown until the other participant joins. */
function WaitingIndicator({ label, variant }: WaitingIndicatorProps) {
  const remoteParticipants = useRemoteParticipants()
  if (remoteParticipants.length > 0) return null

  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="text-center text-white">
          <Video className="mx-auto mb-4 size-12 text-primary" />
          <h3 className="text-lg font-bold">Waiting for doctor</h3>
          <p className="mt-2 text-sm text-white/70">{label}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-warning" />
      </span>
      {label}
    </div>
  )
}

/** NFR-REL-02: surface a reconnecting transport instead of a frozen call. */
function ConnectionNotice() {
  const state = useConnectionState()
  if (state !== ConnectionState.Reconnecting) return null

  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-warning/30 bg-black/60 px-4 py-2 text-sm text-warning backdrop-blur-sm">
      Reconnecting…
    </div>
  )
}

/** NFR-REL-02: the camera failed but the consultation is still live. */
function AudioOnlyNotice() {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-warning/30 bg-black/60 px-4 py-2 text-sm text-warning backdrop-blur-sm">
      <MicOff className="size-4" />
      Audio-only mode
    </div>
  )
}
