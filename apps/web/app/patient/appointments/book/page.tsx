"use client"

import type { AvailableSlotDto, DoctorProfileDto } from "@workspace/shared"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
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
import { DatePicker } from "@workspace/ui/components/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Field, FieldLabel } from "@workspace/ui/components/field"
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
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Calendar,
  ChevronRight,
  Filter,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { TimeSlotPicker } from "@/components/time-slot-picker"
import { useAvailableSlots, useBookAppointment } from "@/hooks/use-appointments"
import { useDoctors } from "@/hooks/use-doctors"

const SPECIALTIES = [
  "General Practice",
  "Internal Medicine",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Obstetrics and Gynecology",
  "Psychiatry",
  "Neurology",
  "Pulmonology",
  "Gastroenterology",
]

export default function BookAppointmentPage() {
  const router = useRouter()

  // Directory Filters States
  const [search, setSearch] = useState("")
  const [specialty, setSpecialty] = useState<string>("all")
  const [sort, setSort] = useState<"name" | "price">("name")

  // Booking Modal States
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfileDto | null>(
    null,
  )
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split("T")[0] ?? "",
  )
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotDto | null>(
    null,
  )
  const [visitReason, setVisitReason] = useState("")
  const [visitSymptoms, setVisitSymptoms] = useState("")
  const [visitType, setVisitType] = useState<"VIDEO" | "PHONE" | "IN_PERSON">(
    "VIDEO",
  )
  const [dpaConsent, setDpaConsent] = useState(false)

  // 1. Fetch Doctors Directory (react-query)
  const { data: doctors = [], isPending: doctorsLoading } = useDoctors({
    search: search.trim() || undefined,
    specialty: specialty !== "all" ? specialty : undefined,
    sort,
  })

  // 2. Fetch Slots Query (triggers when booking date & doctor change)
  const { data: slots = [], isPending: slotsLoading } = useAvailableSlots(
    selectedDoctor?.id ?? "",
    bookingDate,
  )

  // 3. Create Appointment Mutation
  const bookMutation = useBookAppointment()

  // Handle Booking Trigger
  const handleOpenBooking = (doctor: DoctorProfileDto) => {
    setSelectedDoctor(doctor)
    setBookingDate(new Date().toISOString().split("T")[0] ?? "")
    setSelectedSlot(null)
    setVisitReason("")
    setVisitSymptoms("")
    setVisitType("VIDEO")
    setDpaConsent(false)
  }

  // Handle Booking Execution Transaction
  const handleConfirmBooking = () => {
    if (!selectedDoctor) {
      toast.error("Please select a doctor")
      return
    }
    if (!selectedSlot) {
      toast.error("Please select a time slot")
      return
    }
    if (!dpaConsent) {
      toast.error("You must review and consent to the Data Privacy Notice")
      return
    }

    bookMutation.mutate(
      {
        doctorId: selectedDoctor.id,
        scheduleId: selectedSlot.scheduleId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: visitReason.trim() || undefined,
        symptoms: visitSymptoms.trim() || undefined,
        type: visitType,
      },
      {
        onSuccess: () => {
          toast.success("Appointment successfully booked in PHT time!")
          setSelectedDoctor(null)
          router.push("/patient/appointments")
        },
        onError: (err: Error) => {
          toast.error(
            err.message || "Failed to book appointment. Slot may be taken.",
          )
        },
      },
    )
  }

  // Use doctors directly from API (already filtered by search/specialty/sort)
  const displayedDoctors = doctors

  // Format price helper (PHP currency ₱)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Book a Consultation
          </CardTitle>
          <CardDescription className="text-sm">
            Find licensed healthcare providers and reserve secure video slots
            instantly.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Directory Search & Filters */}
      <Card className="border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filter Directory
          </CardTitle>
          <CardDescription className="text-xs">
            Refine the listings of approved practicing professionals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <Label
                htmlFor="search-name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Search Doctor Name
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-name"
                  placeholder="e.g. Dr. Maria Santos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-muted/10 border-border/60"
                />
              </div>
            </div>

            {/* Specialty select */}
            <Field>
              <FieldLabel
                htmlFor="specialty-filter"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Specialty
              </FieldLabel>
              <Select
                value={specialty}
                onValueChange={(val) => setSpecialty(val ?? "all")}
              >
                <SelectTrigger
                  id="specialty-filter"
                  className="bg-muted/10 border-border/60"
                >
                  <SelectValue placeholder="All Specialties">
                    {specialty === "all" ? "All Specialties" : specialty}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {SPECIALTIES.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Sort select */}
            <Field>
              <FieldLabel
                htmlFor="sort-filter"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Sort By
              </FieldLabel>
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as "name" | "price")}
              >
                <SelectTrigger
                  id="sort-filter"
                  className="bg-muted/10 border-border/60"
                >
                  <SelectValue placeholder="Name">
                    {sort === "name" ? "Doctor Name" : "Price (Low → High)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="name">Doctor Name</SelectItem>
                    <SelectItem value="price">Price (Low → High)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Directory listings grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center justify-between">
          <span>Available Specialists</span>
          <span className="text-xs text-muted-foreground font-normal">
            Doctors:{" "}
            <strong className="text-foreground">
              {displayedDoctors.length}
            </strong>
          </span>
        </h3>

        {doctorsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card
                key={idx}
                className="animate-pulse bg-card/60 border border-border/40"
              >
                <CardHeader className="space-y-3">
                  <div className="flex gap-4 items-center">
                    <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-28 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-3.5 w-full bg-muted rounded mt-2" />
                  <div className="h-3.5 w-4/5 bg-muted rounded" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : displayedDoctors.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Stethoscope className="h-4 w-4" />
              </EmptyMedia>
              <EmptyTitle>No approved doctors available</EmptyTitle>
              <EmptyDescription>
                There are currently no approved providers listed matching your
                query.
              </EmptyDescription>
            </EmptyHeader>
            {(specialty !== "all" || search) && (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-border/60"
                  onClick={() => {
                    setSearch("")
                    setSpecialty("all")
                  }}
                >
                  Reset Search Filters
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="border border-border/40 bg-card hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
              >
                <CardHeader className="pb-3">
                  <div className="flex gap-4 items-start justify-between">
                    <div className="flex gap-3 items-center">
                      <Avatar size="lg" className="border border-primary/20 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase">
                          {doctor.user.name?.[0] || doctor.user.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <CardTitle className="text-base font-bold truncate max-w-40 text-foreground">
                          {doctor.user.name || "Doctor"}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-xs py-0.5 px-2 leading-none font-bold shrink-0"
                          >
                            {doctor.specialty}
                          </Badge>
                          <div className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold shrink-0">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                            <span>
                              {doctor.averageRating !== undefined &&
                              doctor.averageRating > 0
                                ? doctor.averageRating.toFixed(1)
                                : "5.0"}
                            </span>
                            <span className="text-xs text-muted-foreground font-normal">
                              ({doctor.totalReviews ?? 0})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mt-3 pt-1">
                    {doctor.bio ||
                      "No biography provided. Licensed practicing medical professional in the Philippines."}
                  </p>
                </CardHeader>

                <CardContent className="pb-4 pt-1">
                  <div className="flex flex-col gap-2 bg-muted/20 border border-border/20 rounded-xl p-3 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Consultation Fee:</span>
                      <strong className="text-foreground text-sm font-bold">
                        {formatPrice(Number(doctor.pricePerVisit) || 0)}
                      </strong>
                    </div>
                    {doctor.clinicAddress && (
                      <div className="flex justify-between gap-1 items-start text-muted-foreground pt-1 border-t border-border/10">
                        <span>Location:</span>
                        <span
                          className="text-foreground text-right truncate max-w-32.5"
                          title={doctor.clinicAddress}
                        >
                          {doctor.clinicAddress}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/15 border-t border-border/20 py-3.5 px-6 flex justify-end">
                  <Button
                    size="sm"
                    className="text-xs font-semibold flex items-center gap-1 hover:gap-1.5 transition-all group/btn"
                    onClick={() => handleOpenBooking(doctor)}
                  >
                    Book Consult
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Dialog Modal Form */}
      <Dialog
        open={!!selectedDoctor}
        onOpenChange={(open) => !open && setSelectedDoctor(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule Appointment
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Reserving a slot with <strong>{selectedDoctor?.user.name}</strong>{" "}
              ({selectedDoctor?.specialty}). Renders availability in Philippine
              Time (PHT).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 my-4 py-1 text-left">
            {/* Visit Type selector */}
            <Field>
              <FieldLabel
                htmlFor="visit-type"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Consultation Type
              </FieldLabel>
              <Select
                value={visitType}
                onValueChange={(v) =>
                  setVisitType(v as "VIDEO" | "PHONE" | "IN_PERSON")
                }
              >
                <SelectTrigger
                  id="visit-type"
                  className="bg-muted/10 border-border/60"
                >
                  <SelectValue placeholder="Video Consultation">
                    {visitType === "VIDEO"
                      ? "Video Consultation (Virtual)"
                      : visitType === "PHONE"
                        ? "Phone Consultation (Audio)"
                        : "In-Person Consultation (Physical Clinic)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="VIDEO">
                      Video Consultation (Virtual)
                    </SelectItem>
                    <SelectItem value="PHONE">
                      Phone Consultation (Audio)
                    </SelectItem>
                    <SelectItem value="IN_PERSON">
                      In-Person Consultation (Physical Clinic)
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Date selector */}
            <div className="space-y-1.5">
              <Label
                htmlFor="booking-date"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Select Date
              </Label>
              <DatePicker
                id="booking-date"
                value={bookingDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(val) => {
                  setBookingDate(val)
                  setSelectedSlot(null)
                }}
              />
            </div>

            {/* Slots selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Select Time Slot</span>
                {slotsLoading && (
                  <span className="text-xs text-muted-foreground font-normal animate-pulse">
                    Checking availability...
                  </span>
                )}
              </Label>

              <TimeSlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
                isLoading={slotsLoading}
              />
            </div>

            {/* Intake forms */}
            <div className="space-y-1.5">
              <Label
                htmlFor="visit-reason"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Reason for Visit (Short Summary)
              </Label>
              <Input
                id="visit-reason"
                placeholder="e.g. Regular medical follow-up"
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
                className="bg-muted/10 border-border/60 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="visit-symptoms"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Additional Intake Symptoms
              </Label>
              <Textarea
                id="visit-symptoms"
                placeholder="Describe current symptoms or background health questions..."
                value={visitSymptoms}
                onChange={(e) => setVisitSymptoms(e.target.value)}
                rows={2}
                className="bg-muted/10 border-border/60 text-sm leading-relaxed"
              />
            </div>

            {/* DPA Consent Checkbox Notice */}
            <div className="bg-muted/30 border border-border/20 rounded-xl p-3.5 space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                Data Privacy Act Compliance (RA 10173)
              </h4>
              <p className="text-xs text-muted-foreground leading-normal">
                By toggling the consent switch below, you explicitly agree to
                share your medical profile, weight, height, allergies, and
                symptoms with the selected healthcare provider strictly for
                evaluation, diagnosis, and treatment purposes.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  id="dpa-consent"
                  size="sm"
                  checked={dpaConsent}
                  onCheckedChange={(checked) => setDpaConsent(Boolean(checked))}
                />
                <Label
                  htmlFor="dpa-consent"
                  className="text-xs font-medium leading-tight text-foreground/80 cursor-pointer select-none"
                >
                  I give explicit data sharing consent for this consultation.
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/15 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedDoctor(null)}
              className="h-8 text-xs border-border/60"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={bookMutation.isPending || !selectedSlot || !dpaConsent}
              onClick={handleConfirmBooking}
              className="h-8 text-xs font-semibold shadow-sm"
            >
              {bookMutation.isPending ? (
                <>
                  <Spinner className="mr-2 size-3.5" />
                  Booking Slot...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
