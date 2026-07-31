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
    expect(screen.getByText("Overview")).toBeDefined()
    expect(screen.getByText("Dashboard")).toBeDefined()
  })

  it("renders health tools section", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    expect(screen.getByText("Health Tools")).toBeDefined()
    expect(screen.getByText("AI Symptom Checker")).toBeDefined()
    expect(screen.getByText("Medical Records")).toBeDefined()
    expect(screen.getByText("Prescriptions")).toBeDefined()
  })

  it("renders all overview items", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    expect(screen.getByText("Book Appointment")).toBeDefined()
    expect(screen.getByText("Appointments")).toBeDefined()
    expect(screen.getByText("Messages")).toBeDefined()
  })

  it("renders user name and email in footer", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    expect(screen.getByText("Juan Dela Cruz")).toBeDefined()
    expect(screen.getByText("juan@example.com")).toBeDefined()
  })

  it("renders sidebar nav items", async () => {
    const { SidebarPatient } = await import("@/components/sidebar-patient")
    renderWithSidebar(<SidebarPatient user={mockUser} />)
    // Sidebar is hidden via CSS in jsdom; check that the DOM contains items
    expect(screen.getByText("Dashboard")).toBeDefined()
    expect(screen.getByText("Book Appointment")).toBeDefined()
  })
})

describe("SidebarDoctor", () => {
  it("renders practice section with dashboard link", async () => {
    const { SidebarDoctor } = await import("@/components/sidebar-doctor")
    renderWithSidebar(<SidebarDoctor user={mockUser} />)
    expect(screen.getByText("Practice")).toBeDefined()
    expect(screen.getByText("Dashboard")).toBeDefined()
  })

  it("renders patient care section", async () => {
    const { SidebarDoctor } = await import("@/components/sidebar-doctor")
    renderWithSidebar(<SidebarDoctor user={mockUser} />)
    expect(screen.getByText("Patient Care")).toBeDefined()
    expect(screen.getByText("Patients")).toBeDefined()
    expect(screen.getByText("Messages")).toBeDefined()
  })

  it("renders practice items", async () => {
    const { SidebarDoctor } = await import("@/components/sidebar-doctor")
    renderWithSidebar(<SidebarDoctor user={mockUser} />)
    expect(screen.getByText("Consultations")).toBeDefined()
    expect(screen.getByText("Schedule")).toBeDefined()
  })

  it("renders user name in footer", async () => {
    const { SidebarDoctor } = await import("@/components/sidebar-doctor")
    renderWithSidebar(<SidebarDoctor user={mockUser} />)
    expect(screen.getByText("Juan Dela Cruz")).toBeDefined()
    expect(screen.getByText("juan@example.com")).toBeDefined()
  })
})

describe("SidebarAdmin", () => {
  it("renders overview section", async () => {
    const { SidebarAdmin } = await import("@/components/sidebar-admin")
    renderWithSidebar(<SidebarAdmin user={mockUser} />)
    expect(screen.getByText("Overview")).toBeDefined()
    expect(screen.getByText("Dashboard")).toBeDefined()
    expect(screen.getByText("Reports")).toBeDefined()
  })

  it("renders management section", async () => {
    const { SidebarAdmin } = await import("@/components/sidebar-admin")
    renderWithSidebar(<SidebarAdmin user={mockUser} />)
    expect(screen.getByText("Management")).toBeDefined()
    expect(screen.getByText("Users")).toBeDefined()
    expect(screen.getByText("Doctors")).toBeDefined()
    expect(screen.getByText("Audit Logs")).toBeDefined()
  })

  it("renders user name in footer", async () => {
    const { SidebarAdmin } = await import("@/components/sidebar-admin")
    renderWithSidebar(<SidebarAdmin user={mockUser} />)
    expect(screen.getByText("Juan Dela Cruz")).toBeDefined()
  })

  it("renders support and feedback links", async () => {
    const { SidebarAdmin } = await import("@/components/sidebar-admin")
    renderWithSidebar(<SidebarAdmin user={mockUser} />)
    expect(screen.getByText("Support")).toBeDefined()
    expect(screen.getByText("Feedback")).toBeDefined()
  })
})
