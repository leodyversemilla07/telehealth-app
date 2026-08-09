import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { UserDto } from "@workspace/shared"
import { describe, expect, it, vi } from "vitest"
import { BanDialog } from "@/components/admin/users/ban-dialog"
import { RoleDialog } from "@/components/admin/users/role-dialog"

const user = {
  id: "u1",
  name: "Pat Doe",
  email: "pat@example.com",
  role: "PATIENT",
} as unknown as UserDto

const doctor = {
  ...user,
  id: "u2",
  name: "Doc Lee",
  role: "DOCTOR",
} as unknown as UserDto

describe("RoleDialog", () => {
  it("shows the selected user and their current role", () => {
    render(
      <RoleDialog
        isOpen
        onClose={() => {}}
        selectedUserForRole={{ user, role: "PATIENT" }}
        onChangeSelectedRole={() => {}}
        onConfirm={() => {}}
        isPending={false}
      />,
    )
    expect(screen.getByText("Change User Role")).toBeDefined()
    expect(screen.getByText("Pat Doe")).toBeDefined()
    expect(screen.getByText("PATIENT")).toBeDefined()
  })

  it("disables confirm when the role is unchanged", () => {
    render(
      <RoleDialog
        isOpen
        onClose={() => {}}
        selectedUserForRole={{ user, role: "PATIENT" }}
        onChangeSelectedRole={() => {}}
        onConfirm={() => {}}
        isPending={false}
      />,
    )
    expect(
      screen.getByText("Confirm Role Change").closest("button")?.disabled,
    ).toBe(true)
  })

  it("enables confirm once the role differs and fires onConfirm", async () => {
    const onConfirm = vi.fn()
    const onChange = vi.fn()
    const { rerender } = render(
      <RoleDialog
        isOpen
        onClose={() => {}}
        selectedUserForRole={{ user, role: "PATIENT" }}
        onChangeSelectedRole={onChange}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )
    rerender(
      <RoleDialog
        isOpen
        onClose={() => {}}
        selectedUserForRole={{ user, role: "ADMIN" }}
        onChangeSelectedRole={onChange}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )
    const confirm = screen.getByText("Confirm Role Change").closest("button")
    expect(confirm?.disabled).toBe(false)
    await userEvent.setup().click(confirm!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("shows the spinner label and disables Confirm while pending", () => {
    render(
      <RoleDialog
        isOpen
        onClose={() => {}}
        selectedUserForRole={{ user, role: "ADMIN" }}
        onChangeSelectedRole={() => {}}
        onConfirm={() => {}}
        isPending
      />,
    )
    const confirm = screen.getByText("Updating...").closest("button")
    expect(confirm?.disabled).toBe(true)
  })

  it("closes via the Cancel button", async () => {
    const onClose = vi.fn()
    render(
      <RoleDialog
        isOpen
        onClose={onClose}
        selectedUserForRole={{ user: doctor, role: "DOCTOR" }}
        onChangeSelectedRole={() => {}}
        onConfirm={() => {}}
        isPending={false}
      />,
    )
    expect(screen.getByText(/Current role/)).toBeDefined()
    await userEvent.setup().click(screen.getByText("Cancel"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe("BanDialog", () => {
  it("renders the banned user and an optional reason input", () => {
    render(
      <BanDialog
        isOpen
        onClose={() => {}}
        selectedUserForBan={user}
        banReason=""
        onBanReasonChange={() => {}}
        onConfirm={() => {}}
        isPending={false}
      />,
    )
    expect(screen.getByText("Ban User Account")).toBeDefined()
    expect(screen.getByText("Pat Doe")).toBeDefined()
    expect(
      screen.getByPlaceholderText("Violation of terms, spamming..."),
    ).toBeDefined()
  })

  it("propagates the typed ban reason", async () => {
    const onReasonChange = vi.fn()
    render(
      <BanDialog
        isOpen
        onClose={() => {}}
        selectedUserForBan={user}
        banReason=""
        onBanReasonChange={onReasonChange}
        onConfirm={() => {}}
        isPending={false}
      />,
    )
    await userEvent
      .setup()
      .type(
        screen.getByPlaceholderText("Violation of terms, spamming..."),
        "spam reports",
      )
    // controlled input: each keystroke funnels through the change handler
    expect(onReasonChange).toHaveBeenCalled()
  })

  it("submits the form through onConfirm", async () => {
    const onConfirm = vi.fn()
    render(
      <BanDialog
        isOpen
        onClose={() => {}}
        selectedUserForBan={user}
        banReason="spam"
        onBanReasonChange={() => {}}
        onConfirm={onConfirm}
        isPending={false}
      />,
    )
    await userEvent.setup().click(screen.getByText("Confirm Ban"))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  })

  it("disables and relabels while pending", () => {
    render(
      <BanDialog
        isOpen
        onClose={() => {}}
        selectedUserForBan={user}
        banReason="spam"
        onBanReasonChange={() => {}}
        onConfirm={() => {}}
        isPending
      />,
    )
    const confirm = screen.getByText("Banning...").closest("button")
    expect(confirm?.disabled).toBe(true)
  })
})
