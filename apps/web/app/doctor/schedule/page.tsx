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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Coffee,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
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

const WEEKDAYS = [
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
    error: scheduleError,
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

  // Load backend schedule into local state when queried
  useEffect(() => {
    if (schedule) {
      setSlotDuration(schedule.slotDuration)

      const loadedDays = { ...days }
      for (const day of WEEKDAYS) {
        const rawJson = (schedule as any)[day.key]
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
  }, [schedule, days])

  // Handle Day Toggle Checkbox
  const handleToggleDay = (key: string) => {
    setDays((prev) => ({
      ...prev,
      [key]: { ...prev[key]!, active: !prev[key]?.active },
    }))
  }

  // Handle Time input changes
  const handleTimeChange = (
    key: string,
    field: "start" | "end",
    val: string,
  ) => {
    setDays((prev) => ({
      ...prev,
      [key]: { ...prev[key]!, [field]: val },
    }))
  }

  // Submit recurring availability to database
  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault()

    toast.loading("Saving weekly schedule shifts...", { id: "save-sched" })

    const payload: any = { slotDuration }
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
      onError: (err: any) => {
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
        onError: (err: any) => {
          toast.error(err.message || "Failed to register time off.", {
            id: "add-to",
          })
        },
      },
    )
  }

  // Delete blocked time-off slot
  const handleDeleteTimeOff = (id: string) => {
    if (!confirm("Are you sure you want to remove this blocked period?")) return

    toast.loading("Removing time block...", { id: "del-to" })

    deleteTimeOffMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Time block removed successfully!", { id: "del-to" })
        refetchTimeOff()
      },
      onError: (err: any) => {
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
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-semibold animate-pulse">
            Loading schedule configurations...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          Availability & Schedule Manager
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure weekly recurring consultation shifts and manage blocked
          time-off slots.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly schedule editor card */}
        <Card className="lg:col-span-2 border border-border/40 bg-card shadow-sm">
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
            <CardContent className="space-y-5">
              {/* Duration selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 bg-muted/20 border border-border/20 rounded-xl p-4 text-sm font-semibold">
                <div className="space-y-1">
                  <Label
                    htmlFor="slot-duration"
                    className="text-xs text-muted-foreground uppercase font-bold tracking-wider"
                  >
                    Consultation Duration
                  </Label>
                  <p className="text-[11px] text-muted-foreground font-normal">
                    Duration of each individual patient slot interval.
                  </p>
                </div>
                <Select
                  value={String(slotDuration)}
                  onValueChange={(val) => setSlotDuration(Number(val))}
                >
                  <SelectTrigger
                    id="slot-duration"
                    className="bg-card border-border/60 font-semibold max-w-[200px] sm:ml-auto"
                  >
                    <SelectValue placeholder="30 Minutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="45">45 Minutes</SelectItem>
                    <SelectItem value="60">60 Minutes</SelectItem>
                    <SelectItem value="120">2 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border/30" />

              {/* Weekly Day Columns List */}
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
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
                        <input
                          id={`toggle-${day.key}`}
                          type="checkbox"
                          checked={config.active}
                          onChange={() => handleToggleDay(day.key)}
                          className="h-4.5 w-4.5 rounded border-border/60 text-primary focus:ring-primary/20 shrink-0 cursor-pointer"
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
                              className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider"
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
                              className="h-9 font-medium max-w-[120px]"
                              required
                            />
                          </div>

                          <span className="mt-5 text-muted-foreground/60">
                            —
                          </span>

                          <div className="space-y-1">
                            <Label
                              htmlFor={`end-${day.key}`}
                              className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider"
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
                              className="h-9 font-medium max-w-[120px]"
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
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
          <Card className="border border-border/40 bg-card shadow-sm">
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
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="to-start"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Start DateTime (PHT)
                  </Label>
                  <Input
                    id="to-start"
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    value={toStart}
                    onChange={(e) => setToStart(e.target.value)}
                    className="h-9 bg-muted/10 border-border/60"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="to-end"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    End DateTime (PHT)
                  </Label>
                  <Input
                    id="to-end"
                    type="datetime-local"
                    min={toStart || new Date().toISOString().slice(0, 16)}
                    value={toEnd}
                    onChange={(e) => setToEnd(e.target.value)}
                    className="h-9 bg-muted/10 border-border/60"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="to-reason"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Reason (Optional)
                  </Label>
                  <Input
                    id="to-reason"
                    placeholder="e.g. Attending PRC Medical Seminar"
                    value={toReason}
                    onChange={(e) => setToReason(e.target.value)}
                    className="h-9 bg-muted/10 border-border/60 text-xs"
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-1 pb-4 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  disabled={addTimeOffMutation.isPending}
                >
                  {addTimeOffMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
          <Card className="border border-border/40 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Blocked Calendars</span>
                <Badge variant="secondary" className="text-[10px]">
                  Blocks: {timeOffs.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 max-h-[220px] overflow-y-auto pr-1">
              {timeOffLoading ? (
                <div className="space-y-3 py-1">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-10 rounded-lg bg-muted animate-pulse border border-border/40"
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
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarRange className="h-3 w-3 text-primary shrink-0" />
                            {formatDt(to.startDate)} — {formatDt(to.endDate)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          disabled={deleteTimeOffMutation.isPending}
                          onClick={() => handleDeleteTimeOff(to.id)}
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
    </div>
  )
}
