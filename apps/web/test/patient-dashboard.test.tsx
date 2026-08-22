import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Variant data swapped per test through this mutable bag.
const m = vi.hoisted(() => ({
  profile: null as null | {
    id: string
    user: { name: string }
  },
  profilePending: false,
  profileError: null as Error | null,
  appts: [] as Array<Record<string, unknown>>,
  apptsPending: false,
  apptsError: null as Error | null,
  records: [] as Array<Record<string, unknown>>,
  recordsPending: false,
  recordsError: null as Error | null,
  prescriptions: [] as Array<Record<string, unknown>>,
  rxPending: false,
  rxError: null as Error | null,
  refetchProfile: vi.fn(),
  refetchAppts: vi.fn(),
  refetchRecords: vi.fn(),
  refetchRx: vi.fn(),
  push: vi.fn(),
}))

vi.mock("@/lib/trpc/client", () => ({
  useTRPC: () => ({
    patients: {
      me: {
        queryOptions: () => ({
          queryKey: ["patients", "me"],
          queryFn: async () => {
            if (m.profileError) throw m.profileError
            return m.profile
          },
        }),
      },
    },
  }),
}))

vi.mock("@/hooks/use-appointments", () => ({
  useMyAppointments: () => ({
    data: { appointments: m.appts },
    isPending: m.apptsPending,
    error: m.apptsError,
    refetch: m.refetchAppts,
  }),
}))

vi.mock("@/hooks/use-records", () => ({
  usePatientRecords: () => ({
    data: m.records,
    isPending: m.recordsPending,
    error: m.recordsError,
    refetch: m.refetchRecords,
  }),
  usePatientPrescriptions: () => ({
    data: m.prescriptions,
    isPending: m.rxPending,
    error: m.rxError,
    refetch: m.refetchRx,
  }),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: m.push }) }))

function makeAppointment(id: string, status: string, doctor: string) {
  return {
    id,
    status,
    startTime: "2026-08-20T04:00:00.000Z",
    doctor: {
      user: { name: doctor },
      specialty: "Cardiology",
    },
  }
}

async function renderDashboard() {
  const Page = (await import("@/app/patient/dashboard/page")).default
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  m.profile = null
  m.profilePending = false
  m.profileError = null
  m.appts = []
  m.apptsPending = false
  m.apptsError = null
  m.records = []
  m.recordsPending = false
  m.recordsError = null
  m.prescriptions = []
  m.rxPending = false
  m.rxError = null
  m.refetchProfile.mockClear()
  m.refetchAppts.mockClear()
  m.refetchRecords.mockClear()
  m.refetchRx.mockClear()
  m.push.mockClear()
})

describe("PatientDashboardPage", () => {
  it("shows the skeleton while initial data is pending", async () => {
    m.profilePending = true
    m.apptsPending = true
    m.recordsPending = true
    m.rxPending = true
    await renderDashboard()
    expect(screen.queryByText(/Hello,/)).toBeNull()
    expect(
      document.querySelectorAll('[class*="animate-pulse"]').length,
    ).toBeGreaterThan(0)
  })

  it("renders the welcome header, stats and next appointment", async () => {
    m.profile = { id: "u1", user: { name: "Alice" } }
    m.appts = [
      makeAppointment("a1", "CONFIRMED", "Dr. Brain"),
      makeAppointment("a2", "BOOKED", "Dr. Heart"),
      makeAppointment("a3", "COMPLETED", "Dr. Lung"),
    ]
    m.records = [
      {
        id: "r1",
        diagnosis: "Hypertension",
        appointment: {
          id: "a3",
          startTime: "2026-08-01T04:00:00.000Z",
          doctor: { user: { name: "Dr. Lung" }, specialty: "Pulmonology" },
        },
      },
    ]
    m.prescriptions = [{ id: "p1" }, { id: "p2" }]
    await renderDashboard()

    await screen.findByText(/Hello, Alice!/)
    expect(screen.getByText("Upcoming")).toBeDefined()
    expect(screen.getByText("Completed")).toBeDefined()
    // stat values: upcoming 2, completed 1, records 1, prescriptions 2
    expect(screen.getByText("Next Scheduled Appointment")).toBeDefined()
    expect(screen.getByText("Dr. Brain")).toBeDefined()
    expect(screen.getByText("Consultation Room")).toBeDefined()
    expect(screen.getByText("Recent Consultations")).toBeDefined()
    expect(screen.getByText(/Hypertension/)).toBeDefined()
  })

  it("renders zeros and empty states when there is no data", async () => {
    m.profile = { id: "u1", user: { name: "Bob" } }
    await renderDashboard()
    await screen.findByText(/Hello, Bob!/)
    expect(screen.queryByText("Next Scheduled Appointment")).toBeNull()
    expect(screen.getByText("No consultations recorded")).toBeDefined()
    // empty-state CTA
    expect(screen.getByText("Book Consultation")).toBeDefined()
  })

  it("shows an error banner and retries when every fetch fails", async () => {
    m.profile = null
    m.profilePending = false
    m.profileError = new Error("network down")
    m.apptsError = new Error("network down")
    m.recordsError = new Error("network down")
    m.rxError = new Error("network down")
    await renderDashboard()

    expect(
      await screen.findByText("Failed to load your dashboard"),
    ).toBeDefined()
    expect(screen.getByText("network down")).toBeDefined()
    await userEvent.setup().click(screen.getByText("Try again"))
    // profile refetch is the real react-query hook — the three mocked hooks fire
    expect(m.refetchAppts).toHaveBeenCalledTimes(1)
    expect(m.refetchRecords).toHaveBeenCalledTimes(1)
    expect(m.refetchRx).toHaveBeenCalledTimes(1)
  })

  it("opens the next appointment details with the router", async () => {
    m.profile = { id: "u1", user: { name: "Alice" } }
    m.appts = [makeAppointment("a-2", "CONFIRMED", "Dr. Brain")]
    await renderDashboard()
    await screen.findByText("Next Scheduled Appointment")
    await userEvent.setup().click(screen.getByText("View Details"))
    expect(m.push).toHaveBeenCalledWith("/patient/appointments/a-2")
  })
})
