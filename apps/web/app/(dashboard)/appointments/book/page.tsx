"use client"

import React, { useState, useMemo } from "react"
import type { CreateAppointmentDto, DoctorProfileDto, VisitType } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Monitor,
  Phone,
  Search,
  Stethoscope,
  Video,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
 useApprovedDoctors,
 useAvailableSlots,
 useBookAppointment,
} from "@/hooks/use-appointments"

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS = ["Choose Doctor", "Pick Date & Time", "Confirm"] as const
type Step = (typeof STEPS)[number]

// ── Visit type config ────────────────────────────────────────────────────────

const VISIT_TYPES: { value: VisitType; label: string; icon: React.ElementType }[] = [
  { value: "VIDEO", label: "Video Call", icon: Video },
  { value: "PHONE", label: "Phone Call", icon: Phone },
  { value: "IN_PERSON", label: "In Person", icon: Monitor },
]

// ── Date helpers ─────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatDateISO(date: Date) {
  return date.toISOString().split("T")[0]
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  timeStyle: "short",
  hour12: true,
})

// ── Main page ────────────────────────────────────────────────────────────────

export default function BookAppointmentPage() {
  // Step state
  const [step, setStep] = useState<Step>(STEPS[0])
  const stepIndex = STEPS.indexOf(step)

  // Step 1: Choose doctor
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfileDto | null>(null)

  // Step 2: Pick date & time
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string; scheduleId: string } | null>(null)
  const [visitType, setVisitType] = useState<VisitType>("VIDEO")

  // Step 3: Reason
  const [reason, setReason] = useState("")
  const [symptoms, setSymptoms] = useState("")

  // ── Data fetching ────────────────────────────────────────────────────────

 const { data: doctors, isPending: doctorsLoading } = useApprovedDoctors()
 const { data: slots, isPending: slotsLoading } = useAvailableSlots(
 selectedDoctor?.id ?? "",
    selectedDate,
  )

  const bookMutation = useBookAppointment()

  // ── Filter providers by search ───────────────────────────────────────────

 const filteredDoctors = useMemo(() => {
 if (!doctors) return []
 const q = searchQuery.toLowerCase().trim()
 if (!q) return doctors
 return doctors.filter(
 (d) =>
 d.specialty?.toLowerCase().includes(q) ||
 d.user?.name?.toLowerCase().includes(q),
 )
 }, [doctors, searchQuery])

  // ── Calendar data ────────────────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)
  const isCurrentMonth =
    calYear === today.getFullYear() && calMonth === today.getMonth()

  // ── Step navigation ──────────────────────────────────────────────────────

  function goNext() {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  function canGoNext(): boolean {
    switch (step) {
 case "Choose Doctor":
 return !!selectedDoctor
      case "Pick Date & Time":
        return !!selectedSlot && !!selectedDate
      case "Confirm":
        return true
      default:
        return false
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────

 function handleBook() {
 if (!selectedDoctor || !selectedSlot) return

 const dto: CreateAppointmentDto = {
 doctorId: selectedDoctor.id,
      scheduleId: selectedSlot.scheduleId,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      type: visitType,
      reason: reason || undefined,
      symptoms: symptoms || undefined,
    }

    bookMutation.mutate(dto, {
      onSuccess: () => {
        toast.success("Appointment booked successfully!")
        // Redirect to appointments list
        window.location.href = "/appointments"
      },
      onError: (err: { message?: string }) => {
        toast.error(err.message || "Failed to book appointment.")
      },
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Back nav ──────────────────────────────────────────────────────── */}
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Appointments
      </Link>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Book an Appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a doctor, pick a time, and you&apos;re all set.
        </p>
      </div>

      {/* ── Step indicator ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                i <= stepIndex
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground border border-transparent"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < stepIndex
                    ? "bg-primary text-primary-foreground"
                    : i === stepIndex
                    ? "border-2 border-primary text-primary"
                    : "bg-muted-foreground/20 text-muted-foreground"
                }`}
              >
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-border" />
            )}
          </React.Fragment>
        ))}
      </div>

      <Separator />

      {/* ── Step 1: Choose Doctor ──────────────────────────────────────────── */}
      {step === "Choose Doctor" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Doctor list */}
          {doctorsLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

 {!doctorsLoading && filteredDoctors.length === 0 && (
 <div className="text-center py-10 text-muted-foreground text-sm">
 {searchQuery
 ? "No doctors match your search."
 : "No doctors available at the moment."}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {/* Doctor list */}
 {filteredDoctors.map((doctor) => {
 const isSelected = selectedDoctor?.id === doctor.id
              return (
                <Card
                  key={doctor.id}
                  className={`cursor-pointer transition-all border ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border/40 hover:border-primary/30 hover:shadow-sm"
                  }`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">
                          {doctor.user?.name || "Doctor"}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {doctor.specialty || "General Practice"}
                        </CardDescription>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step 2: Pick Date & Time ───────────────────────────────────────── */}
      {step === "Pick Date & Time" && selectedDoctor && (
        <div className="space-y-5">
          {/* Selected doctor summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/40">
            <Stethoscope className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {selectedDoctor.user?.name || "Doctor"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedDoctor.specialty || "General Practice"}
              </p>
            </div>
          </div>

          {/* Visit type selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Visit Type</Label>
            <div className="flex gap-2">
              {VISIT_TYPES.map((vt) => {
                const Icon = vt.icon
                const isActive = visitType === vt.value
                return (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => setVisitType(vt.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {vt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Select Date</Label>
            <Card className="border-border/40">
              <CardContent className="pt-4 pb-4">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11)
                        setCalYear(calYear - 1)
                      } else {
                        setCalMonth(calMonth - 1)
                      }
                      setSelectedDate("")
                      setSelectedSlot(null)
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0)
                        setCalYear(calYear + 1)
                      } else {
                        setCalMonth(calMonth + 1)
                      }
                      setSelectedDate("")
                      setSelectedSlot(null)
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_NAMES.map((d) => (
                    <div
                      key={d}
                      className="text-center text-[10px] font-semibold text-muted-foreground py-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dateObj = new Date(calYear, calMonth, day)
                    const dateStr = formatDateISO(dateObj)
                    const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    const isSelected = selectedDate === dateStr
                    const isToday =
                      dateObj.toDateString() === today.toDateString()

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isPast}
                        onClick={() => {
                          setSelectedDate(dateStr ?? "")
                          setSelectedSlot(null)
                        }}
                        className={`h-9 w-full rounded-lg text-xs font-medium transition-colors flex items-center justify-center ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : isToday
                            ? "bg-primary/10 text-primary font-bold"
                            : isPast
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available slots */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Available Times for{" "}
                {new Intl.DateTimeFormat("en-PH", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(new Date(selectedDate + "T00:00:00"))}
              </Label>

              {slotsLoading && (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available slots...
                </div>
              )}

              {!slotsLoading && slots && slots.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  No available slots on this date. Please try another day.
                </p>
              )}

              {!slotsLoading && slots && slots.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const isSelected =
                      selectedSlot?.startTime === slot.startTime &&
                      selectedSlot?.scheduleId === slot.scheduleId
                    return (
                      <button
                        key={`${slot.scheduleId}-${slot.startTime}`}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/40 bg-card text-foreground hover:border-primary/30"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {timeFormatter.format(new Date(slot.startTime))}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Confirm ────────────────────────────────────────────────── */}
      {step === "Confirm" && selectedDoctor && selectedSlot && (
        <div className="space-y-5">
          {/* Summary card */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Booking Summary</CardTitle>
              <CardDescription>
                Review your appointment details before confirming.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Doctor */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {selectedDoctor.user?.name || "Doctor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedDoctor.specialty || "General Practice"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Date & time */}
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {new Intl.DateTimeFormat("en-PH", {
                    dateStyle: "full",
                  }).format(new Date(selectedSlot.startTime))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {timeFormatter.format(new Date(selectedSlot.startTime))} &ndash;{" "}
                  {timeFormatter.format(new Date(selectedSlot.endTime))}
                </p>
              </div>

              <Separator />

              {/* Visit type */}
              <div className="flex items-center gap-3">
                {React.createElement(
                  VISIT_TYPES.find((v) => v.value === visitType)?.icon ?? Video,
                  { className: "h-4 w-4 text-muted-foreground" },
                )}
                <p className="text-sm">
                  {VISIT_TYPES.find((v) => v.value === visitType)?.label ?? "Video Call"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reason & Symptoms */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-sm">Additional Details</CardTitle>
              <CardDescription>
                Optional — helps the doctor prepare for your visit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs font-medium">
                  Reason for Visit
                </Label>
                <Input
                  id="reason"
                  placeholder="e.g., Follow-up checkup, persistent headache..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="symptoms" className="text-xs font-medium">
                  Symptoms
                </Label>
                <Input
                  id="symptoms"
                  placeholder="e.g., Fever, dizziness, fatigue..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Navigation buttons ────────────────────────────────────────────── */}
      <Separator />
      <div className="flex items-center justify-between">
        {stepIndex > 0 ? (
          <Button variant="outline" onClick={goBack} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {stepIndex < STEPS.length - 1 ? (
          <Button
            onClick={goNext}
            disabled={!canGoNext()}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleBook}
            disabled={bookMutation.isPending}
            className="gap-1.5"
          >
            {bookMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Confirm Booking
          </Button>
        )}
      </div>
    </div>
  )
}
