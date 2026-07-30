import { render, screen } from "@testing-library/react"
import { SidebarProvider } from "@workspace/ui/components/sidebar"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  usePathname: () => "/patient/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={String(alt ?? "")} {...props} />
  ),
}))

const hidden = { hidden: true } as const

function renderWithSidebar(ui: ReactNode) {
  return render(<SidebarProvider>{ui}</SidebarProvider>)
}

const mockUser = {
  name: "Juan Dela Cruz",
  email: "juan@example.com",
  avatar: "/avatar.jpg",
}

describe("SidebarPatient", () => {
  it("renders overview section with dashboard link", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    expect(screen.getByText("Overview", hidden)).toBeDefined()
    expect(screen.getByText("Dashboard", hidden)).toBeDefined()
  })

  it("renders health tools section", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    expect(screen.getByText("Health Tools", hidden)).toBeDefined()
    expect(screen.getByText("AI Symptom Checker", hidden)).toBeDefined()
    expect(screen.getByText("Medical Records", hidden)).toBeDefined()
    expect(screen.getByText("Prescriptions", hidden)).toBeDefined()
  })

  it("renders all overview items", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    expect(screen.getByText("Book Appointment", hidden)).toBeDefined()
    expect(screen.getByText("Appointments", hidden)).toBeDefined()
    expect(screen.getByText("Messages", hidden)).toBeDefined()
  })

  it("renders user name and email in footer", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    expect(screen.getByText("Juan Dela Cruz", hidden)).toBeDefined()
    expect(screen.getByText("juan@example.com", hidden)).toBeDefined()
  })

  it("renders sidebar nav items", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    // Sidebar is hidden via CSS in jsdom; check that the DOM contains items
    expect(screen.getByText("Dashboard", { hidden: true })).toBeDefined()
    expect(screen.getByText("Book Appointment", { hidden: true })).toBeDefined()
  })
})

describe("SidebarDoctor", () => {
  it("renders practice section with dashboard link", async () => {
    const { SidebarDoctor } = await import("@/components/sidebar-doctor")
    renderWithSidebar(<SidebarDoctor user={mockUser} />)
    expect(screen.getByText("Practice", hidden)).toBeDefined()
    expect(screen.getByText("Dashboard", hidden)).toBeDefined()
  })

  it("renders patient care section", async () => {
    const { SidebarDoctor } = await import("@/components/sidebar-doctor")
    renderWithSidebar(<SidebarDoctor user={mockUser} />)
    expect(screen.getByText("Patient Care", hidden)).toBeDefined()
    expect(screen.getByText("Patients", hidden)).toBeDefined()
    expect(screen.getByText("Messages", hidden)).toBeDefined()
  })

  it("renders practice items", async () => {
    const { SidebarDoctor } = await import("@/components/sidebar-doctor")
    renderWithSidebar(<SidebarDoctor user={mockUser} />)
    expect(screen.getByText("Consultations", hidden)).toBeDefined()
    expect(screen.getByText("Schedule", hidden)).toBeDefined()
  })

  it("renders user name in footer", async () => {
    const { SidebarDoctor } = await import("@/components/sidebar-doctor")
    renderWithSidebar(<SidebarDoctor user={mockUser} />)
    expect(screen.getByText("Juan Dela Cruz", hidden)).toBeDefined()
    expect(screen.getByText("juan@example.com", hidden)).toBeDefined()
  })
})

describe("SidebarAdmin", () => {
  it("renders overview section", async () => {
    const { SidebarAdmin } = await import("@/components/sidebar-admin")
    renderWithSidebar(<SidebarAdmin user={mockUser} />)
    expect(screen.getByText("Overview", hidden)).toBeDefined()
    expect(screen.getByText("Dashboard", hidden)).toBeDefined()
    expect(screen.getByText("Reports", hidden)).toBeDefined()
  })

  it("renders management section", async () => {
    const { SidebarAdmin } = await import("@/components/sidebar-admin")
    renderWithSidebar(<SidebarAdmin user={mockUser} />)
    expect(screen.getByText("Management", hidden)).toBeDefined()
    expect(screen.getByText("Users", hidden)).toBeDefined()
    expect(screen.getByText("Doctors", hidden)).toBeDefined()
    expect(screen.getByText("Audit Logs", hidden)).toBeDefined()
  })

  it("renders user name in footer", async () => {
    const { SidebarAdmin } = await import("@/components/sidebar-admin")
    renderWithSidebar(<SidebarAdmin user={mockUser} />)
    expect(screen.getByText("Juan Dela Cruz", hidden)).toBeDefined()
  })

  it("renders support and feedback links", async () => {
    const { SidebarAdmin } = await import("@/components/sidebar-admin")
    renderWithSidebar(<SidebarAdmin user={mockUser} />)
    expect(screen.getByText("Support", hidden)).toBeDefined()
    expect(screen.getByText("Feedback", hidden)).toBeDefined()
  })
})
