"use client"

import { Calendar } from "@workspace/ui/components/calendar"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { format, parseISO, setHours, setMinutes } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import * as React from "react"

export interface DateTimePickerProps {
  /** ISO-8601 datetime string (YYYY-MM-DDTHH:mm) */
  value?: string
  onChange?: (value: string) => void
  /** ISO-8601 minimum datetime (YYYY-MM-DDTHH:mm) */
  min?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

export function DateTimePicker({
  value,
  onChange,
  min,
  placeholder = "Pick date & time",
  className,
  disabled,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse the current value into date + time parts
  const parsed = React.useMemo(() => {
    if (!value) return { date: undefined, time: "00:00" }
    try {
      const d = parseISO(value)
      return {
        date: d,
        time: format(d, "HH:mm"),
      }
    } catch {
      return { date: undefined, time: "00:00" }
    }
  }, [value])

  const minDate = React.useMemo(() => {
    if (!min) return undefined
    try {
      return parseISO(min)
    } catch {
      return undefined
    }
  }, [min])

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    const [h, m] = (parsed.time || "00:00").split(":").map(Number)
    const combined = setMinutes(setHours(day, h ?? 0), m ?? 0)
    onChange?.(format(combined, "yyyy-MM-dd'T'HH:mm"))
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value
    if (!parsed.date) return
    const [h, m] = t.split(":").map(Number)
    const combined = setMinutes(setHours(parsed.date, h ?? 0), m ?? 0)
    onChange?.(format(combined, "yyyy-MM-dd'T'HH:mm"))
  }

  const displayLabel = parsed.date
    ? `${format(parsed.date, "MMM d, yyyy")} at ${parsed.time}`
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "w-full justify-start text-left font-normal bg-muted/10 border border-border/60 h-9 px-3 rounded-xl flex items-center hover:bg-muted/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-sm",
          !displayLabel && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        {displayLabel ?? <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsed.date}
          onSelect={handleDaySelect}
          disabled={(date) => {
            if (minDate) {
              // Allow same day, block strictly past days
              const d = new Date(date)
              d.setHours(0, 0, 0, 0)
              const md = new Date(minDate)
              md.setHours(0, 0, 0, 0)
              return d < md
            }
            return false
          }}
          initialFocus
        />
        {/* Time picker row */}
        <div className="border-t border-border/30 p-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <Label className="text-xs text-muted-foreground font-medium shrink-0">
            Time
          </Label>
          <Input
            type="time"
            value={parsed.time}
            onChange={handleTimeChange}
            className="h-8 text-sm w-full"
            disabled={!parsed.date}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
