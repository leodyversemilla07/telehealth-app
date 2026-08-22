import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({
  appointments: [] as Array<Record<string, unknown>> | null,
  isPending: false,
  error: null as Error | null,
  refetch: vi.fn(),
  push: vi.fn(),
}))

vi.mock("@/hooks/use-appointments", () => ({
  useMyAppointments: () => ({
    data:
      m.appointments === null ? undefined : { appointments: m.appointments },
    isPending: m.isPending,
    error: m.error,
    refetch: m.refetch,
  }),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: m.push }) }))

function makeAppointment(id: string, status: string, patient: string) {
  return {
    id,
    status,
    type: "VIDEO",
    startTime: "2026-08-20T04:00:00.000Z",
    patient: { name: patient },
  }
}

async function renderDashboard() {
  const Page = (await import("@/app/doctor/dashboard/page")).default
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
  m.appointments = []
  m.isPending = false
  m.error = null
  m.refetch.mockClear()
  m.push.mockClear()
})

describe("DoctorDashboardPage", () => {
  it("renders the skeleton while loading", async () => {
    m.isPending = true
    await renderDashboard()
    expect(screen.queryByText("Doctor Dashboard")).toBeNull()
    expect(
      document.querySelectorAll('[class*="animate-pulse"]').length,
    ).toBeGreaterThan(0)
  })

  it("renders stat cards derived from appointment statuses", async () => {
    m.appointments = [
      makeAppointment("a1", "IN_PROGRESS", "Jane"),
      makeAppointment("a2", "COMPLETED", "Jack"),
      makeAppointment("a3", "COMPLETED", "Jill"),
      makeAppointment("a4", "BOOKED", "Joe"),
      makeAppointment("a5", "CONFIRMED", "Jen"),
      makeAppointment("a6", "BOOKED", "Jim"),
    ]
    await renderDashboard()
    await screen.findByText("Total Consults")
    expect(screen.getByText("Scheduled")).toBeDefined() // 3 booked+confirmed
    expect(screen.getByText("In Consultation")).toBeDefined() // 1
    expect(screen.getByText("Completed")).toBeDefined() // 2
    // unique stat values: scheduled 3, in-consult 1, completed 2, total 6
    expect(screen.getByText("3")).toBeDefined()
    expect(screen.getByText("1")).toBeDefined()
    expect(screen.getByText("2")).toBeDefined()
    expect(screen.getByText("6")).toBeDefined()
  })

  it("highlights the next scheduled consultation", async () => {
    m.appointments = [
      makeAppointment("a1", "CONFIRMED", "Jen"),
      makeAppointment("a2", "BOOKED", "Joe"),
    ]
    await renderDashboard()
    await screen.findByText("Next Scheduled Consultation")
    expect(screen.getByText("Jen")).toBeDefined()
    expect(screen.getByText("Video Consultation")).toBeDefined()
    expect(screen.getByText("View Details")).toBeDefined()
  })

  it("shows zeroed stats without a next-consultation card when empty", async () => {
    await renderDashboard()
    await screen.findByText("Total Consults")
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4)
    expect(screen.queryByText("Next Scheduled Consultation")).toBeNull()
  })

  it("shows an error banner and retries on failure", async () => {
    m.appointments = null
    m.error = new Error("backend unavailable")
    await renderDashboard()
    expect(
      await screen.findByText("Failed to load your dashboard"),
    ).toBeDefined()
    expect(screen.getByText("backend unavailable")).toBeDefined()
    await userEvent.setup().click(screen.getByText("Try again"))
    expect(m.refetch).toHaveBeenCalledTimes(1)
  })
})
