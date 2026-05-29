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

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange?: (value: string) => void
  placeholder?: string
  min?: string // YYYY-MM-DD
  max?: string // YYYY-MM-DD
  className?: string
  disabled?: boolean
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  min,
  max,
  className,
  disabled,
  id,
}: DatePickerProps) {
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    try {
      return parseISO(value)
    } catch {
      return undefined
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

  const maxDate = React.useMemo(() => {
    if (!max) return undefined
    try {
      return parseISO(max)
    } catch {
      return undefined
    }
  }, [max])

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    const formatted = format(date, "yyyy-MM-dd")
    onChange?.(formatted)
  }

  return (
    <Popover>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "w-full justify-start text-left font-normal bg-muted/10 border border-border/60 h-9 px-3 rounded-xl flex items-center hover:bg-muted/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-sm",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
        {dateValue ? format(dateValue, "PPP") : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
