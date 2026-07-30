import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const mockGet = vi.fn()
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

async function renderAdminDoctors() {
  const AdminDoctorsPage = (await import("@/app/admin/doctors/page")).default

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  mockGet.mockResolvedValue(MOCK_DOCTORS)

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AdminDoctorsPage />
    </QueryClientProvider>,
  )

  await screen.findByText("Doctor Verification")
  return result
}

describe("AdminDoctorsPage", () => {
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
})
