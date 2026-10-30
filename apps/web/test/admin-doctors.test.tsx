import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGet = vi.fn()
const mockPatch = vi.fn()
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}))

vi.mock("@workspace/ui/components/toast", () => ({
  toast: { add: vi.fn() },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MOCK_DOCTORS = {
  items: [
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
      isApproved: false,
      createdAt: "2026-03-20T00:00:00Z",
      user: {
        id: "u2",
        name: "Dr. Skin",
        email: "skin@clinic.com",
        image: null,
      },
    },
    {
      id: "d3",
      userId: "u3",
      specialty: "Pediatrics",
      prcLicenseNumber: "PRC345678",
      prcLicenseExpiry: "2028-01-01T00:00:00Z",
      philhealthAccreditation: "PHL-002",
      bio: "Child health specialist",
      clinicAddress: "Pasig",
      pricePerVisit: 1200,
      isApproved: true,
      createdAt: "2026-02-10T00:00:00Z",
      user: {
        id: "u3",
        name: "Dr. Child",
        email: "child@clinic.com",
        image: null,
      },
    },
  ],
  total: 3,
}

async function renderAdminDoctors({ fail = false } = {}) {
  const AdminDoctorsPage = (await import("@/app/admin/doctors/page")).default

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  if (fail) {
    mockGet.mockRejectedValue(new Error("network down"))
  } else {
    mockGet.mockResolvedValue(MOCK_DOCTORS)
  }
  mockPatch.mockResolvedValue({ id: "d1" })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AdminDoctorsPage />
    </QueryClientProvider>,
  )

  await screen.findByText("Doctor Verification")
  return result
}

/** First element carrying the label, with an explicit failure instead of `!`. */
function first(label: string): HTMLElement {
  const [el] = screen.getAllByText(label)
  if (!el) throw new Error(`No element found for ${label}`)
  return el
}

describe("AdminDoctorsPage", () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPatch.mockReset()
  })

  it("renders the page title and description", async () => {
    await renderAdminDoctors()
    expect(screen.getByText("Doctor Verification")).toBeDefined()
    expect(
      screen.getByText(
        "Review and approve licensed doctors after verifying their PRC credentials.",
      ),
    ).toBeDefined()
  })

  it("renders the search input", async () => {
    await renderAdminDoctors()
    expect(
      screen.getByPlaceholderText("Search by name, email, or specialty..."),
    ).toBeDefined()
  })

  it("shows stats counts", async () => {
    await renderAdminDoctors()
    // Wait for data to load, then find the stats
    expect(await screen.findByText("Total:")).toBeDefined()
  })

  it("renders status filter pills", async () => {
    await renderAdminDoctors()
    expect(screen.getByText("All")).toBeDefined()
    expect(screen.getByText("Pending")).toBeDefined()
    expect(screen.getByText("Approved")).toBeDefined()
  })

  it("shows doctor rows after loading", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")
    expect(screen.getByText("Dr. Skin")).toBeDefined()
    expect(screen.getByText("Dr. Child")).toBeDefined()
  })

  it("shows pagination controls", async () => {
    await renderAdminDoctors()
    await screen.findByText("Rows per page:")
  })

  it("shows approve button for pending doctors", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")
    const approveButtons = screen.getAllByText("Approve")
    expect(approveButtons.length).toBe(1)
  })

  it("shows revoke button for approved doctors", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")
    const revokeButtons = screen.getAllByText("Revoke")
    expect(revokeButtons.length).toBe(2)
  })

  it("approves a pending doctor", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Skin")

    await userEvent.setup().click(screen.getByText("Approve"))

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/admin/doctors/d2/approve"),
    )
  })

  it("verifies an approved doctor's credentials", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")

    await userEvent.setup().click(first("Verify"))

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/admin/doctors/d1/verify"),
    )
  })

  it("revokes approval through the reject dialog with a reason", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")

    const user = userEvent.setup()
    await user.click(first("Revoke"))
    await screen.findByText("Revoke doctor approval")

    await user.type(
      screen.getByLabelText("Rejection reason"),
      "PRC license could not be validated",
    )
    await user.click(screen.getByText("Confirm rejection"))

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith("/admin/doctors/d1/reject", {
        reason: "PRC license could not be validated",
      }),
    )
  })

  it("closes the reject dialog without patching on Cancel", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")

    const user = userEvent.setup()
    await user.click(first("Revoke"))
    await screen.findByText("Revoke doctor approval")
    await user.click(screen.getByText("Cancel"))

    await waitFor(() =>
      expect(screen.queryByText("Revoke doctor approval")).toBeNull(),
    )
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it("filters to pending doctors only", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /^Pending/ }))

    expect(await screen.findByText("Dr. Skin")).toBeDefined()
    expect(screen.queryByText("Dr. Heart")).toBeNull()
  })

  it("filters by search term across name, email and specialty", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")

    await userEvent
      .setup()
      .type(
        screen.getByPlaceholderText("Search by name, email, or specialty..."),
        "dermatology",
      )

    expect(await screen.findByText("Dr. Skin")).toBeDefined()
    expect(screen.queryByText("Dr. Heart")).toBeNull()
  })

  it("shows the empty state when a filter matches nothing", async () => {
    await renderAdminDoctors()
    await screen.findByText("Dr. Heart")

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /^Rejected/ }))

    expect(await screen.findByText("No doctors found")).toBeDefined()
  })

  it("surfaces an error alert when the fetch fails", async () => {
    await renderAdminDoctors({ fail: true })

    expect(await screen.findByText("Failed to retrieve doctors")).toBeDefined()
    expect(screen.getByText("network down")).toBeDefined()
  })
})
