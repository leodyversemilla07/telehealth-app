"use client"

import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as React from "react"
import type { DateRange } from "react-day-picker"

export interface DateRangePickerProps {
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
  onChange?: (range: { from?: string; to?: string }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Pick a date range",
  className,
  disabled,
  id,
}: DateRangePickerProps) {
  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!from && !to) return undefined
    return {
      from: from ? parseISO(from) : undefined,
      to: to ? parseISO(to) : undefined,
    }
  }, [from, to])

  const handleSelect = (range: DateRange | undefined) => {
    if (!onChange) return
    onChange({
      from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
    })
  }

  const displayLabel = React.useMemo(() => {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
      }
      return format(dateRange.from, "MMM d, yyyy")
    }
    return null
  }, [dateRange])

  return (
    <Popover>
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
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
