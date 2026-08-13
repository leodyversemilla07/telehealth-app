import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import BookAppointmentPage from "@/app/patient/appointments/book/page"

const mockGet = vi.fn()
const slotsHolder = vi.hoisted(() => ({
  slots: [] as Array<Record<string, unknown>>,
}))
const navHolder = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: vi.fn(),
  },
}))

vi.mock("@workspace/ui/components/toast", () => ({
  toast: { add: vi.fn() },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navHolder.push }),
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock("@/lib/trpc/client", () => ({
  useTRPC: () => ({
    doctors: {
      list: {
        queryOptions: () => ({
          queryKey: ["doctors", "list"],
          queryFn: async () => MOCK_DOCTORS,
        }),
      },
    },
    availability: {
      getAvailableSlots: {
        queryOptions: () => ({
          queryKey: ["availability", "slots"],
          queryFn: async () => slotsHolder.slots,
        }),
      },
    },
    appointments: {
      create: {
        mutationOptions: () => ({
          mutationFn: async () => ({ id: "appt-1" }),
        }),
      },
    },
  }),
}))

const MOCK_DOCTORS = [
  {
    id: "d1",
    userId: "u1",
    specialty: "Cardiology",
    prcLicenseNumber: "PRC123456",
    prcLicenseExpiry: "2027-06-01T00:00:00Z",
    philhealthAccreditation: "PHL-001",
    bio: "Experienced heart specialist",
    clinicAddress: "Quezon City",
    pricePerVisit: 1500,
    isApproved: true,
    createdAt: "2026-01-15T00:00:00Z",
    averageRating: 4.8,
    totalReviews: 12,
    user: {
      id: "u1",
      name: "Dr. Heart",
      email: "heart@clinic.com",
      image: null,
    },
  },
  {
    id: "d2",
    userId: "u2",
    specialty: "Dermatology",
    prcLicenseNumber: "PRC789012",
    prcLicenseExpiry: "2026-12-01T00:00:00Z",
    philhealthAccreditation: null,
    bio: "Skin care expert",
    clinicAddress: "Makati",
    pricePerVisit: 2000,
    isApproved: true,
    createdAt: "2026-03-20T00:00:00Z",
    averageRating: 4.5,
    totalReviews: 8,
    user: { id: "u2", name: "Dr. Skin", email: "skin@clinic.com", image: null },
  },
]

async function renderBookAppointment() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  mockGet.mockImplementation((url: string) => {
    if (url === "/doctors") return Promise.resolve(MOCK_DOCTORS)
    return Promise.resolve([])
  })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <BookAppointmentPage />
    </QueryClientProvider>,
  )

  await screen.findByText("Book a Consultation", {}, { timeout: 10_000 })
  return result
}

describe("BookAppointmentPage - AI symptom feature", () => {
  it("renders the page title", async () => {
    await renderBookAppointment()
    expect(screen.getByText("Book a Consultation")).toBeDefined()
  })

  it("renders the Find by Symptoms button", async () => {
    await renderBookAppointment()
    expect(screen.getByText("Find by Symptoms")).toBeDefined()
  })

  it("opens the symptom dialog when clicking Find by Symptoms", async () => {
    await renderBookAppointment()
    await userEvent.setup().click(screen.getByText("Find by Symptoms"))
    expect(await screen.findByText("Find a Doctor by Symptoms")).toBeDefined()
  })

  it("shows the symptom textarea in the dialog", async () => {
    await renderBookAppointment()
    await userEvent.setup().click(screen.getByText("Find by Symptoms"))
    expect(
      await screen.findByPlaceholderText(
        /e\.g\. I have a persistent headache/i,
      ),
    ).toBeDefined()
  })

  it("shows Find Specialists button in the dialog", async () => {
    await renderBookAppointment()
    await userEvent.setup().click(screen.getByText("Find by Symptoms"))
    expect(await screen.findByText("Find Specialists")).toBeDefined()
  })

  it("Find Specialists button is disabled when textarea is empty", async () => {
    await renderBookAppointment()
    await userEvent.setup().click(screen.getByText("Find by Symptoms"))
    const button = (await screen.findByText("Find Specialists")).closest(
      "button",
    )
    expect(button?.hasAttribute("disabled")).toBe(true)
  })

  it("closes dialog when clicking Cancel", async () => {
    await renderBookAppointment()
    await userEvent.setup().click(screen.getByText("Find by Symptoms"))
    await screen.findByText("Find a Doctor by Symptoms")
    await userEvent.setup().click(screen.getByText("Cancel"))
    await waitFor(() =>
      expect(screen.queryByText("Find a Doctor by Symptoms")).toBeNull(),
    )
  })

  it("renders the specialty filter dropdown", async () => {
    await renderBookAppointment()
    expect(screen.getByText("All Specialties")).toBeDefined()
  })

  it("renders the search input", async () => {
    await renderBookAppointment()
    expect(screen.getByPlaceholderText(/e.g. Dr. Maria Santos/i)).toBeDefined()
  })
})

describe("BookAppointmentPage - booking flow", () => {
  // One PHT-midday slot so the picker stays deterministic in any CI timezone.
  const SLOT = {
    id: "s1",
    scheduleId: "sch-1",
    doctorId: "d1",
    startTime: "2026-08-20T04:00:00.000Z",
    endTime: "2026-08-20T05:00:00.000Z",
  }

  async function openBookingDialog() {
    await renderBookAppointment()
    const [bookConsult] = await screen.findAllByText("Book Consult")
    if (!bookConsult) {
      throw new Error("Book Consult button was not rendered")
    }

    await userEvent.setup().click(bookConsult)
    await screen.findByText("Schedule Appointment")
  }

  it("keeps Confirm Booking disabled until a slot and consent are chosen", async () => {
    slotsHolder.slots = [SLOT]
    await openBookingDialog()

    const notReady = screen.getByText("Confirm Booking").closest("button")
    expect(notReady?.hasAttribute("disabled")).toBe(true)

    // select the PHT-midday slot
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "12:00 PM" }))
    // still disabled without DPA consent
    const noConsent = screen.getByText("Confirm Booking").closest("button")
    expect(noConsent?.hasAttribute("disabled")).toBe(true)
  })

  it("books the appointment and navigates to the appointments list", async () => {
    const { toast } = await import("@workspace/ui/components/toast")
    slotsHolder.slots = [SLOT]
    await openBookingDialog()

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "12:00 PM" }))
    await userEvent.setup().click(screen.getByRole("switch"))

    const confirm = screen.getByText("Confirm Booking").closest("button")
    if (!confirm) {
      throw new Error("Confirm Booking button was not rendered")
    }

    expect(confirm.hasAttribute("disabled")).toBe(false)
    await userEvent.setup().click(confirm)

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith({
        title: "Appointment successfully booked in PHT time!",
        type: "success",
      }),
    )
    expect(navHolder.push).toHaveBeenCalledWith("/patient/appointments")
  })
})
