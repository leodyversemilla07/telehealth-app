import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ErrorAlert } from "@/components/error-alert"

describe("ErrorAlert", () => {
  it("renders title and description", () => {
    render(
      <ErrorAlert title="Failed to load" description="Backend unreachable" />,
    )
    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText("Failed to load")).toBeDefined()
    expect(screen.getByText("Backend unreachable")).toBeDefined()
  })

  it("renders without a description", () => {
    render(<ErrorAlert title="Only a title" />)
    expect(screen.getByText("Only a title")).toBeDefined()
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("fires onAction when the action button is clicked", async () => {
    const onAction = vi.fn()
    render(
      <ErrorAlert
        title="Retry me"
        actionLabel="Try again"
        onAction={onAction}
      />,
    )
    await userEvent.setup().click(screen.getByText("Try again"))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("does not render an action when onAction is missing", () => {
    render(<ErrorAlert title="No action" actionLabel="Ignored" />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("exposes role=alert for screen readers", () => {
    render(<ErrorAlert title="Alert!" />)
    expect(screen.getByRole("alert").textContent).toContain("Alert!")
  })
})
