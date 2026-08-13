import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

const mockGet = vi.fn()
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("@workspace/ui/components/toast", () => ({
  toast: { add: vi.fn() },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MOCK_USERS = {
  items: [
    {
      id: "1",
      email: "admin@test.com",
      name: "Admin User",
      role: "ADMIN",
      banned: false,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "2",
      email: "doctor@test.com",
      name: "Doctor User",
      role: "DOCTOR",
      banned: false,
      createdAt: "2026-02-01T00:00:00Z",
    },
    {
      id: "3",
      email: "patient@test.com",
      name: "Patient User",
      role: "PATIENT",
      banned: false,
      createdAt: "2026-03-01T00:00:00Z",
    },
    {
      id: "4",
      email: "banned@test.com",
      name: "Banned User",
      role: "PATIENT",
      banned: true,
      banReason: "Spam",
      createdAt: "2026-04-01T00:00:00Z",
    },
  ],
  total: 4,
}

async function renderAdminUsers() {
  const AdminUsersPage = (await import("@/app/admin/users/page")).default

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  mockGet.mockResolvedValue(MOCK_USERS)

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AdminUsersPage />
    </QueryClientProvider>,
  )

  await screen.findByText("Users Management")
  return result
}

describe("AdminUsersPage", () => {
  it("renders the page title", async () => {
    await renderAdminUsers()
    expect(screen.getByText("Users Management")).toBeDefined()
  })

  it("renders the search bar", async () => {
    await renderAdminUsers()
    expect(
      screen.getByPlaceholderText("Search by name or email..."),
    ).toBeDefined()
  })

  it("renders role filter pills", async () => {
    await renderAdminUsers()
    expect(screen.getByText("All")).toBeDefined()
    expect(screen.getByText("Patient")).toBeDefined()
    expect(screen.getByText("Doctor")).toBeDefined()
    expect(screen.getByText("Admin")).toBeDefined()
  })

  it("shows total count", async () => {
    await renderAdminUsers()
    expect(await screen.findByText("Rows per page:")).toBeDefined()
    // Pagination shows total in format "Page 1 of 1 · 4 total"
    await screen.findByText(/total/)
  })

  it("filters users by role when clicking a pill", async () => {
    await renderAdminUsers()
    await screen.findByText("Rows per page:")

    const user = userEvent.setup()
    const doctorPill = screen.getByText("Doctor")
    await user.click(doctorPill)

    // doctor@test.com appears in both visible and mobile spans
    const matches = await screen.findAllByText("doctor@test.com")
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText("admin@test.com")).toBeNull()
  })

  it("filters users by search query", async () => {
    await renderAdminUsers()
    await screen.findByText("Rows per page:")

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(
      "Search by name or email...",
    )
    await user.type(searchInput, "doctor")

    const matches = await screen.findAllByText("doctor@test.com")
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText("admin@test.com")).toBeNull()
  })

  it("shows pagination controls", async () => {
    await renderAdminUsers()
    await screen.findByText("Rows per page:")
  })
})
