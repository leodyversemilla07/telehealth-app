import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AvailableSlotDto } from "@workspace/shared"
import { describe, expect, it, vi } from "vitest"
import { TimeSlotPicker } from "@/components/time-slot-picker"

// PHT midday (UTC 04:00 → 12:00 NN) — deterministic across CI timezones.
const slot = (start: string): AvailableSlotDto => ({
  scheduleId: "sch1",
  startTime: start,
  endTime: new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(),
})

const SLOTS: AvailableSlotDto[] = [
  slot("2026-08-20T04:00:00.000Z"),
  slot("2026-08-20T05:00:00.000Z"),
  slot("2026-08-20T06:00:00.000Z"),
]

// Mirror the component's formatter so label matching is environment-proof.
function slotLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })
}

describe("TimeSlotPicker", () => {
  it("renders skeleton placeholders while loading", () => {
    render(
      <TimeSlotPicker
        slots={[]}
        selectedSlot={null}
        onSelect={() => {}}
        isLoading
      />,
    )
    // no slot buttons yet, just the skeleton grid
    expect(screen.queryByRole("button")).toBeNull()
    expect(
      document.querySelectorAll('[class*="animate-pulse"]').length,
    ).toBeGreaterThan(0)
  })

  it("renders the empty state when there are no slots", () => {
    render(
      <TimeSlotPicker
        slots={[]}
        selectedSlot={null}
        onSelect={() => {}}
        isLoading={false}
      />,
    )
    expect(screen.getByText(/No slots available on this date/i)).toBeDefined()
  })

  it("renders a time button per slot in PHT", () => {
    render(
      <TimeSlotPicker slots={SLOTS} selectedSlot={null} onSelect={() => {}} />,
    )
    // UTC 04:00 → 12:00 PM in Asia/Manila
    const [first, second, third] = SLOTS
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(third).toBeDefined()
    expect(
      screen.getByRole("button", { name: slotLabel(first!.startTime) }),
    ).toBeDefined()
    expect(
      screen.getByRole("button", { name: slotLabel(second!.startTime) }),
    ).toBeDefined()
    expect(
      screen.getByRole("button", { name: slotLabel(third!.startTime) }),
    ).toBeDefined()
  })

  it("calls onSelect with the clicked slot", async () => {
    const onSelect = vi.fn()
    render(
      <TimeSlotPicker slots={SLOTS} selectedSlot={null} onSelect={onSelect} />,
    )
    const second = SLOTS[1]
    expect(second).toBeDefined()
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: slotLabel(second!.startTime) }))
    expect(onSelect).toHaveBeenCalledWith(second)
  })

  it("disables every slot when the disabled prop is set", () => {
    render(
      <TimeSlotPicker
        slots={SLOTS}
        selectedSlot={SLOTS[0]!}
        onSelect={() => {}}
        disabled
      />,
    )
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(3)
    for (const b of buttons) expect(b.hasAttribute("disabled")).toBe(true)
  })

  it("keeps clicking enabled when disabled is unset", async () => {
    const onSelect = vi.fn()
    render(
      <TimeSlotPicker slots={SLOTS} selectedSlot={null} onSelect={onSelect} />,
    )
    const third = SLOTS[2]
    expect(third).toBeDefined()
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: slotLabel(third!.startTime) }))
    expect(onSelect).toHaveBeenCalledWith(third)
  })
})
