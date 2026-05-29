"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { DateTimePicker } from "@workspace/ui/components/date-time-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  Coffee,
  Plus,
  Trash2,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  useAddTimeOff,
  useDeleteTimeOff,
  useMyAvailability,
  useMyTimeOff,
  useSetAvailability,
} from "@/hooks/use-availability"

interface DayConfig {
  active: boolean
  start: string
  end: string
}

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

const WEEKDAYS: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
]

export default function DoctorSchedulePage() {
  // 1. Fetch recurring availability
  const {
    data: schedule,
    isPending: scheduleLoading,
    refetch: refetchSchedule,
  } = useMyAvailability()

  // 2. Fetch blocked time-off slots
  const {
    data: timeOffs = [],
    isPending: timeOffLoading,
    refetch: refetchTimeOff,
  } = useMyTimeOff()

  // 3. Mutation hooks
  const setAvailabilityMutation = useSetAvailability()
  const addTimeOffMutation = useAddTimeOff()
  const deleteTimeOffMutation = useDeleteTimeOff()

  // State configurations
  const [slotDuration, setSlotDuration] = useState<number>(30)
  const [days, setDays] = useState<Record<string, DayConfig>>({
    monday: { active: false, start: "09:00", end: "17:00" },
    tuesday: { active: false, start: "09:00", end: "17:00" },
    wednesday: { active: false, start: "09:00", end: "17:00" },
    thursday: { active: false, start: "09:00", end: "17:00" },
    friday: { active: false, start: "09:00", end: "17:00" },
    saturday: { active: false, start: "09:00", end: "17:00" },
    sunday: { active: false, start: "09:00", end: "17:00" },
  })

  // Time off states
  const [toStart, setToStart] = useState("")
  const [toEnd, setToEnd] = useState("")
  const [toReason, setToReason] = useState("")

  // Delete confirmation dialog state
  const [deleteTimeOffId, setDeleteTimeOffId] = useState<string | null>(null)

  // Load backend schedule into local state when queried
  const scheduleLoaded = useRef(false)
  useEffect(() => {
    if (schedule && !scheduleLoaded.current) {
      scheduleLoaded.current = true
      setSlotDuration(schedule.slotDuration)

      const loadedDays = { ...days }
      for (const day of WEEKDAYS) {
        const rawJson = schedule[day.key]
        try {
          const parsed = JSON.parse(rawJson || "[]") as string[]
          if (parsed.length > 0 && parsed[0]) {
            const [start, end] = parsed[0].split("-")
            loadedDays[day.key] = {
              active: true,
              start: start ?? "09:00",
              end: end ?? "17:00",
            }
          } else {
            loadedDays[day.key] = {
              active: false,
              start: "09:00",
              end: "17:00",
            }
          }
        } catch {
          loadedDays[day.key] = { active: false, start: "09:00", end: "17:00" }
        }
      }
      setDays(loadedDays)
    }
  }, [schedule])

  const DEFAULT_DAY: DayConfig = { active: false, start: "09:00", end: "17:00" }

  // Handle Day Toggle Checkbox
  const handleToggleDay = (key: DayKey) => {
    setDays((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? DEFAULT_DAY),
        active: !(prev[key]?.active ?? false),
      },
    }))
  }

  // Handle Time input changes
  const handleTimeChange = (
    key: DayKey,
    field: "start" | "end",
    val: string,
  ) => {
    setDays((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? DEFAULT_DAY), [field]: val },
    }))
  }

  // Submit recurring availability to database
  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault()

    toast.loading("Saving weekly schedule shifts...", { id: "save-sched" })

    const payload: Record<string, unknown> = { slotDuration }
    for (const day of WEEKDAYS) {
      const config = days[day.key]
      if (config?.active) {
        // Enforce basic validation check
        const [sh, sm] = config.start.split(":").map(Number)
        const [eh, em] = config.end.split(":").map(Number)
        const sMins = (sh ?? 0) * 60 + (sm ?? 0)
        const eMins = (eh ?? 0) * 60 + (em ?? 0)

        if (sMins >= eMins) {
          toast.dismiss("save-sched")
          toast.error(`Shift end time must be after start time on ${day.label}`)
          return
        }

        payload[day.key] = JSON.stringify([`${config.start}-${config.end}`])
      } else {
        payload[day.key] = JSON.stringify([])
      }
    }

    setAvailabilityMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Availability schedule successfully saved!", {
          id: "save-sched",
        })
        refetchSchedule()
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to update availability schedule.", {
          id: "save-sched",
        })
      },
    })
  }

  // Block unavailable time-off period
  const handleAddTimeOff = (e: React.FormEvent) => {
    e.preventDefault()
    if (!toStart || !toEnd) {
      toast.error("Please configure start and end timestamps")
      return
    }

    const sDate = new Date(toStart)
    const eDate = new Date(toEnd)
    if (sDate >= eDate) {
      toast.error("Blocked time-off end date must be after start date")
      return
    }

    toast.loading("Registering time block...", { id: "add-to" })

    addTimeOffMutation.mutate(
      {
        startDate: sDate.toISOString(),
        endDate: eDate.toISOString(),
        reason: toReason.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Time block registered successfully!", { id: "add-to" })
          setToStart("")
          setToEnd("")
          setToReason("")
          refetchTimeOff()
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to register time off.", {
            id: "add-to",
          })
        },
      },
    )
  }

  // Delete blocked time-off slot
  const handleDeleteTimeOff = () => {
    if (!deleteTimeOffId) return

    setDeleteTimeOffId(null)
    toast.loading("Removing time block...", { id: "del-to" })

    deleteTimeOffMutation.mutate(deleteTimeOffId, {
      onSuccess: () => {
        toast.success("Time block removed successfully!", { id: "del-to" })
        refetchTimeOff()
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to remove time block.", {
          id: "del-to",
        })
      },
    })
  }

  if (scheduleLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground text-sm font-semibold animate-pulse">
            Loading schedule configurations...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Title */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Availability & Schedule Manager
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Configure weekly recurring consultation shifts and manage blocked
              time-off slots.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly schedule editor card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Weekly Shifts
            </CardTitle>
            <CardDescription className="text-xs">
              Check active days and set shift boundaries (slots are generated in
              Philippine Time).
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSaveAvailability}>
            <CardContent className="flex flex-col gap-5">
              {/* Duration selector */}
              <Field
                orientation="horizontal"
                className="items-center gap-4 bg-muted/20 border border-border/20 rounded-xl p-4"
              >
                <FieldLabel
                  htmlFor="slot-duration"
                  className="text-xs text-muted-foreground uppercase font-bold tracking-wider"
                >
                  Consultation Duration
                </FieldLabel>
                <FieldContent className="items-end">
                  <Select
                    value={String(slotDuration)}
                    onValueChange={(val) => setSlotDuration(Number(val))}
                  >
                    <SelectTrigger
                      id="slot-duration"
                      className="bg-card border-border/60 font-semibold max-w-50"
                    >
                      <SelectValue placeholder="30 Minutes">
                        {slotDuration === 15
                          ? "15 Minutes"
                          : slotDuration === 30
                            ? "30 Minutes"
                            : slotDuration === 45
                              ? "45 Minutes"
                              : slotDuration === 60
                                ? "60 Minutes"
                                : "2 Hours"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="15">15 Minutes</SelectItem>
                        <SelectItem value="30">30 Minutes</SelectItem>
                        <SelectItem value="45">45 Minutes</SelectItem>
                        <SelectItem value="60">60 Minutes</SelectItem>
                        <SelectItem value="120">2 Hours</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription className="text-xs text-right">
                    Duration of each individual patient slot interval.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Separator className="bg-border/30" />

              {/* Weekly Day Columns List */}
              <div className="flex flex-col gap-3.5">
                {WEEKDAYS.map((day) => {
                  const config = days[day.key] ?? {
                    active: false,
                    start: "09:00",
                    end: "17:00",
                  }

                  return (
                    <div
                      key={day.key}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/20 rounded-xl p-4 transition-all ${
                        config.active
                          ? "bg-muted/15 border-primary/20"
                          : "bg-card hover:bg-muted/10 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          id={`toggle-${day.key}`}
                          checked={config.active}
                          onCheckedChange={() => handleToggleDay(day.key)}
                        />
                        <Label
                          htmlFor={`toggle-${day.key}`}
                          className="text-sm font-bold leading-none cursor-pointer text-foreground"
                        >
                          {day.label}
                        </Label>
                      </div>

                      {config.active && (
                        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground self-end sm:self-auto shrink-0">
                          <div className="space-y-1">
                            <Label
                              htmlFor={`start-${day.key}`}
                              className="text-xs text-muted-foreground uppercase font-bold tracking-wider"
                            >
                              Start Time
                            </Label>
                            <Input
                              id={`start-${day.key}`}
                              type="time"
                              value={config.start}
                              onChange={(e) =>
                                handleTimeChange(
                                  day.key,
                                  "start",
                                  e.target.value,
                                )
                              }
                              className="h-9 font-medium min-w-24 max-w-30"
                              required
                            />
                          </div>

                          <span className="mt-5 text-muted-foreground/60">
                            —
                          </span>

                          <div className="space-y-1">
                            <Label
                              htmlFor={`end-${day.key}`}
                              className="text-xs text-muted-foreground uppercase font-bold tracking-wider"
                            >
                              End Time
                            </Label>
                            <Input
                              id={`end-${day.key}`}
                              type="time"
                              value={config.end}
                              onChange={(e) =>
                                handleTimeChange(day.key, "end", e.target.value)
                              }
                              className="h-9 font-medium min-w-24 max-w-30"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>

            <CardFooter className="border-t border-border/15 py-4 px-6 flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                disabled={setAvailabilityMutation.isPending}
              >
                {setAvailabilityMutation.isPending ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    Saving Shifts...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Save Weekly Schedule
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Blocking Time Off Side panels */}
        <div className="space-y-6">
          {/* Add Time-Off Block */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Coffee className="h-4 w-4 text-primary" />
                Block Time-Off
              </CardTitle>
              <CardDescription className="text-xs">
                Restrict booking slots for vacations or administrative leave.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddTimeOff}>
              <CardContent className="pb-4">
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="to-start">
                      Start DateTime (PHT)
                    </FieldLabel>
                    <DateTimePicker
                      id="to-start"
                      min={new Date().toISOString().slice(0, 16)}
                      value={toStart}
                      onChange={setToStart}
                      placeholder="Pick start date & time"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="to-end">End DateTime (PHT)</FieldLabel>
                    <DateTimePicker
                      id="to-end"
                      min={toStart || new Date().toISOString().slice(0, 16)}
                      value={toEnd}
                      onChange={setToEnd}
                      placeholder="Pick end date & time"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="to-reason">
                      Reason (Optional)
                    </FieldLabel>
                    <Input
                      id="to-reason"
                      placeholder="e.g. Attending PRC Medical Seminar"
                      value={toReason}
                      onChange={(e) => setToReason(e.target.value)}
                      className="h-9 bg-muted/10 border-border/60 text-xs"
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter className="border-t border-border/15 px-6 py-4 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  disabled={addTimeOffMutation.isPending}
                >
                  {addTimeOffMutation.isPending ? (
                    <>
                      <Spinner className="h-3.5 w-3.5" />
                      Blocking...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add Time Block
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Active Time-Off listings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Blocked Calendars</span>
                <Badge variant="secondary" className="text-xs">
                  Blocks: {timeOffs.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 max-h-55 overflow-y-auto pr-1">
              {timeOffLoading ? (
                <div className="space-y-3 py-1">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <Skeleton
                      key={idx}
                      className="h-10 rounded-lg border border-border/40"
                    />
                  ))}
                </div>
              ) : timeOffs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                  No blocked time-off slots.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {timeOffs.map((to) => {
                    const formatDt = (isoStr: string) => {
                      return new Date(isoStr).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Manila",
                      })
                    }

                    return (
                      <div
                        key={to.id}
                        className="flex items-center justify-between gap-3 border border-border/10 rounded-xl p-3 bg-muted/10"
                      >
                        <div className="space-y-1 text-left text-xs">
                          <h5 className="font-bold text-foreground">
                            {to.reason || "Time-Off Block"}
                          </h5>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarRange className="h-3 w-3 text-primary shrink-0" />
                            {formatDt(to.startDate)} — {formatDt(to.endDate)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          disabled={deleteTimeOffMutation.isPending}
                          onClick={() => setDeleteTimeOffId(to.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTimeOffId !== null}
        onOpenChange={(open) => !open && setDeleteTimeOffId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Time Block</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this blocked period? This will
              reopen the slot for patient bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTimeOffId(null)}
              disabled={deleteTimeOffMutation.isPending}
            >
              Keep Block
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTimeOff}
              disabled={deleteTimeOffMutation.isPending}
            >
              {deleteTimeOffMutation.isPending ? "Removing..." : "Yes, Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
