"use client"

import type { AvailableSlotDto } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Clock } from "lucide-react"

interface TimeSlotPickerProps {
  slots: AvailableSlotDto[]
  selectedSlot: AvailableSlotDto | null
  onSelect: (slot: AvailableSlotDto) => void
  isLoading?: boolean
  disabled?: boolean
}

function formatSlotTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })
}

function SlotSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 rounded-lg" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-border/25 bg-muted/30 p-4 text-center">
      <Clock className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
        No slots available on this date. The doctor may be unavailable or fully
        booked. Try another date.
      </p>
    </div>
  )
}

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelect,
  isLoading = false,
  disabled = false,
}: TimeSlotPickerProps) {
  if (isLoading) {
    return <SlotSkeleton />
  }

  if (slots.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.startTime === slot.startTime
        const start = formatSlotTime(slot.startTime)
        const _end = formatSlotTime(slot.endTime)

        return (
          <Button
            key={slot.startTime}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            className={`h-9 text-xs font-semibold transition-all ${
              isSelected
                ? "shadow-sm ring-2 ring-primary/20"
                : "border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            }`}
            onClick={() => onSelect(slot)}
          >
            <Clock className="mr-1 h-3 w-3 shrink-0" />
            {start}
          </Button>
        )
      })}
    </div>
  )
}
