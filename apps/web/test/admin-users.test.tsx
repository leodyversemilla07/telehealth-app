import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPatch = vi.fn()
const mockDelete = vi.fn()
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
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

async function renderAdminUsers({ fail = false } = {}) {
  const AdminUsersPage = (await import("@/app/admin/users/page")).default

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  if (fail) {
    mockGet.mockRejectedValue(new Error("network down"))
  } else {
    mockGet.mockResolvedValue(MOCK_USERS)
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <AdminUsersPage />
    </QueryClientProvider>,
  )

  await screen.findByText("Users Management")
  return result
}

/** First element carrying the label, with an explicit failure instead of `!`. */
function first(label: string): HTMLElement {
  const [el] = screen.getAllByText(label)
  if (!el) throw new Error(`No element found for ${label}`)
  return el
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPatch.mockReset()
    mockDelete.mockReset()
  })

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

  it("bans a user through the dialog with a reason", async () => {
    mockPost.mockResolvedValue({
      id: "1",
      email: "admin@test.com",
      banned: true,
    })
    await renderAdminUsers()
    await screen.findByText("Rows per page:")

    const user = userEvent.setup()
    await user.click(first("Ban"))
    await screen.findByText("Ban User Account")

    await user.type(
      screen.getByPlaceholderText("Violation of terms, spamming..."),
      "Abusive messages",
    )
    await user.click(screen.getByText("Confirm Ban"))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/admin/users/1/ban", {
        reason: "Abusive messages",
      }),
    )
  })

  it("unbans a banned user", async () => {
    mockDelete.mockResolvedValue({
      id: "4",
      email: "banned@test.com",
      banned: false,
    })
    await renderAdminUsers()
    await screen.findByText("Rows per page:")

    await userEvent.setup().click(screen.getByText("Unban"))

    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("/admin/users/4/ban"),
    )
  })

  it("opens the role-change dialog for a non-admin user", async () => {
    await renderAdminUsers()
    await screen.findByText("Rows per page:")

    await userEvent.setup().click(first("Promote"))

    expect(await screen.findByText("Change User Role")).toBeDefined()
    expect(screen.getByText("Confirm Role Change")).toBeDefined()
  })

  it("shows the empty state and resets the search", async () => {
    await renderAdminUsers()
    await screen.findByText("Rows per page:")

    const user = userEvent.setup()
    await user.type(
      screen.getByPlaceholderText("Search by name or email..."),
      "nobody",
    )

    expect(await screen.findByText("No matching users found")).toBeDefined()
    await user.click(screen.getByText("Reset search filter"))
    // email renders in both the mobile and desktop columns
    expect(
      (await screen.findAllByText("doctor@test.com")).length,
    ).toBeGreaterThan(0)
  })

  it("surfaces an error alert when the fetch fails", async () => {
    await renderAdminUsers({ fail: true })

    expect(await screen.findByText("Failed to retrieve users")).toBeDefined()
    expect(screen.getByText("network down")).toBeDefined()
  })
})
