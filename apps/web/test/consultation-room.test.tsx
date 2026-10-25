import { act, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  ConsultationRoom,
  type ConsultationRoomProps,
} from "@/components/consultation-room"

// Controllable LiveKit state. `remoteParticipants` drives the waiting
// indicator; `connectionState` drives the reconnecting notice.
const hooks = vi.hoisted(() => ({
  remoteParticipants: [] as unknown[],
  connectionState: "connected",
}))

// Captures the props handed to the LiveKitRoom stub so the test can invoke
// onMediaDeviceFailure the way LiveKit would.
const roomProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}))

vi.mock("@livekit/components-react", () => ({
  useRemoteParticipants: () => hooks.remoteParticipants,
  useConnectionState: () => hooks.connectionState,
}))

vi.mock("livekit-client", () => ({
  ConnectionState: {
    Connected: "connected",
    Connecting: "connecting",
    Reconnecting: "reconnecting",
    Disconnected: "disconnected",
  },
}))

// The component loads LiveKit via next/dynamic. Render a passthrough instead:
// the room stub exposes its children (where the indicators live) and the
// video-conference stub stands in for the conference UI.
vi.mock("next/dynamic", () => ({
  default: () => (props: Record<string, unknown>) => {
    if (props.token !== undefined) {
      roomProps.current = props
      return <div data-testid="lk-room">{props.children as ReactNode}</div>
    }
    return <div data-testid="video-conference" />
  },
}))

vi.mock("@workspace/ui/components/toast", () => ({
  toast: { add: vi.fn() },
}))

function renderRoom(props: Partial<ConsultationRoomProps> = {}) {
  return render(
    <ConsultationRoom
      token="tok"
      serverUrl="wss://livekit.example.com"
      onDisconnected={vi.fn()}
      waitingLabel="Patient is in the waiting room"
      {...props}
    />,
  )
}

describe("ConsultationRoom", () => {
  beforeEach(() => {
    hooks.remoteParticipants = []
    hooks.connectionState = "connected"
    roomProps.current = null
    vi.clearAllMocks()
  })

  it("renders the waiting indicators inside the LiveKit room context", () => {
    // Regression: a waiting indicator sibling to <LiveKitRoom> crashes
    // useRemoteParticipants with "No room provided".
    renderRoom()
    const room = screen.getByTestId("lk-room")
    expect(room).toContainElement(
      screen.getByText("Patient is in the waiting room"),
    )
    expect(screen.getByTestId("video-conference")).toBeInTheDocument()
  })

  it("hides the waiting banner once a remote participant joins", () => {
    hooks.remoteParticipants = [{}]
    renderRoom()
    expect(
      screen.queryByText("Patient is in the waiting room"),
    ).not.toBeInTheDocument()
  })

  it("renders the patient overlay variant", () => {
    renderRoom({
      waitingVariant: "overlay",
      waitingLabel: "Your doctor will join the consultation shortly",
    })
    expect(screen.getByText("Waiting for doctor")).toBeInTheDocument()
    expect(
      screen.getByText("Your doctor will join the consultation shortly"),
    ).toBeInTheDocument()
  })

  it("degrades to audio-only and notifies when the camera fails (NFR-REL-02)", async () => {
    const { toast } = await import("@workspace/ui/components/toast")
    renderRoom()

    act(() => {
      const handler = roomProps.current?.onMediaDeviceFailure as
        | ((failure: unknown, kind?: string) => void)
        | undefined
      handler?.(null, "videoinput")
    })

    expect(screen.getByText("Audio-only mode")).toBeInTheDocument()
    expect(toast.add).toHaveBeenCalledWith({
      title: "Camera unavailable — continuing with audio only.",
      type: "warning",
    })
  })

  it("surfaces a reconnecting transport (NFR-REL-02)", () => {
    hooks.connectionState = "reconnecting"
    renderRoom()
    expect(screen.getByText("Reconnecting…")).toBeInTheDocument()
  })
})
