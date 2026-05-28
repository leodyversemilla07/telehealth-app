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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useAvailableSlots, useBookAppointment } from "@/hooks/use-appointments"
import { useDoctors } from "@/hooks/use-doctors"
import { useRecommendation } from "@/hooks/use-recommendations"

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
  const [activeTab, setActiveTab] = useState<string>("directory")
  const [search, setSearch] = useState("")
  const [specialty, setSpecialty] = useState<string>("all")
  const [sort, setSort] = useState<"name" | "price">("name")

  // AI Recommendation States
  const [symptomsInput, setSymptomsInput] = useState("")
  const [aiSpecialties, setAiSpecialties] = useState<string[]>([])
  const [aiRecommendedDoctorIds, setAiRecommendedDoctorIds] = useState<
    string[]
  >([])

  // Booking Modal States
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split("T")[0] ?? "",
  )
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
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

  // 2. AI Recommendation Mutation (calls NVIDIA NIM Nemotron model)
  const recommendMutation = useRecommendation()

  // 3. Fetch Slots Query (triggers when booking date & doctor change)
  const { data: slots = [], isPending: slotsLoading } = useAvailableSlots(
    selectedDoctor?.id ?? "",
    bookingDate,
  )

  // 4. Create Appointment Mutation
  const bookMutation = useBookAppointment()

  // Handle AI Recommendation Analysis
  const handleAiAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptomsInput.trim()) {
      toast.error("Please describe your symptoms first")
      return
    }

    toast.loading("Nemotron AI is analyzing your symptoms...", {
      id: "ai-triage",
    })

    recommendMutation.mutate(
      { symptoms: symptomsInput },
      {
        onSuccess: (data) => {
          toast.dismiss("ai-triage")
          if (data.specialties && data.specialties.length > 0) {
            setAiSpecialties(data.specialties)
            const matchedIds = data.doctors?.map((doc: any) => doc.id) ?? []
            setAiRecommendedDoctorIds(matchedIds)
            toast.success(
              `AI identified: ${data.specialties.join(", ")}. Rerouting to recommended providers.`,
            )
          } else {
            toast.info(
              "AI analyzed symptoms but could not match a specialty. Browse our directory.",
            )
          }
        },
        onError: (err: any) => {
          toast.dismiss("ai-triage")
          toast.error(
            err.message ||
              "AI triage service temporarily down. Use standard directory.",
          )
        },
      },
    )
  }

  // Clear AI Recommendations and reset filters
  const resetAiFilters = () => {
    setAiSpecialties([])
    setAiRecommendedDoctorIds([])
    setSymptomsInput("")
    toast.success("Filters reset!")
  }

  // Handle Booking Trigger
  const handleOpenBooking = (doctor: any) => {
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
        symptoms: visitSymptoms.trim() || symptomsInput.trim() || undefined,
        type: visitType,
      },
      {
        onSuccess: () => {
          toast.success("Appointment successfully booked in PHT time!")
          setSelectedDoctor(null)
          router.push("/patient/appointments")
        },
        onError: (err: any) => {
          toast.error(
            err.message || "Failed to book appointment. Slot may be taken.",
          )
        },
      },
    )
  }

  // Filter doctors locally if AI filters are active
  const displayedDoctors = doctors.filter((doc) => {
    if (aiRecommendedDoctorIds.length > 0) {
      return aiRecommendedDoctorIds.includes(doc.id)
    }
    return true
  })

  // Format price helper (PHP currency ₱)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Stethoscope className="h-7 w-7 text-primary" />
          Book a Consultation
        </h1>
        <p className="text-sm text-muted-foreground">
          Find licensed healthcare providers and reserve secure video slots
          instantly.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Standard Directory
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Symptom Classifier
          </TabsTrigger>
        </TabsList>

        {/* Directory Search & Filters tab */}
        <TabsContent value="directory" className="space-y-6 outline-none">
          <Card className="border-border/40 shadow-xs">
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
                <div className="space-y-1.5">
                  <Label
                    htmlFor="specialty-filter"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Specialty
                  </Label>
                  <Select
                    value={specialty}
                    onValueChange={(val) => setSpecialty(val ?? "all")}
                  >
                    <SelectTrigger
                      id="specialty-filter"
                      className="bg-muted/10 border-border/60"
                    >
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {SPECIALTIES.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort select */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sort-filter"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Sort By
                  </Label>
                  <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                    <SelectTrigger
                      id="sort-filter"
                      className="bg-muted/10 border-border/60"
                    >
                      <SelectValue placeholder="Name" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Doctor Name</SelectItem>
                      <SelectItem value="price">Price (Low → High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Symptom recommendations tab */}
        <TabsContent value="ai" className="space-y-6 outline-none">
          <Card className="border-amber-500/10 bg-amber-500/[0.01] shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <Sparkles className="h-5 w-5 animate-pulse" />
                Nemotron Symptom-to-Specialty AI
              </CardTitle>
              <CardDescription className="text-xs">
                Describe your symptoms below. Our NVIDIA NIM-powered medical
                triage engine will automatically map them to appropriate
                specialties and filter verified specialists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAiAnalyze} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="ai-symptoms"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Describe how you feel
                  </Label>
                  <Textarea
                    id="ai-symptoms"
                    placeholder="e.g. I have had a severe throbbing headache behind my eyes for 2 days, accompanied by light sensitivity and mild nausea."
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    rows={3}
                    className="bg-muted/10 border-border/60 text-sm leading-relaxed"
                    disabled={recommendMutation.isPending}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  {aiSpecialties.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetAiFilters}
                      className="text-xs h-9 border-border/60"
                    >
                      Clear Recommendations
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-2 shadow-sm"
                    disabled={recommendMutation.isPending}
                  >
                    {recommendMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyze Symptoms
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {aiSpecialties.length > 0 && (
                <div className="mt-6 pt-5 border-t border-border/40 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    AI Identified Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {aiSpecialties.map((spec) => (
                      <Badge
                        key={spec}
                        className="bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 py-0.5 px-2 text-xs font-medium"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                    Listed doctors have been automatically filtered to display
                    matching specialties.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Renders AI warning if directory is manually filtered but AI results are active */}
      {aiRecommendedDoctorIds.length > 0 && activeTab === "directory" && (
        <div className="bg-amber-500/10 border border-amber-200/30 text-amber-700 rounded-xl p-4 flex items-center justify-between text-xs font-medium shadow-xs">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
            AI Symptom filters are active. Displaying matching specialists.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAiFilters}
            className="h-7 text-[11px] text-amber-700 hover:bg-amber-100/50"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Directory listings grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center justify-between">
          <span>Available Specialists</span>
          <span className="text-[11px] text-muted-foreground font-normal">
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
          <Card className="border border-border/40 p-12 text-center shadow-xs max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-foreground">
                No approved doctors available
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {aiRecommendedDoctorIds.length > 0
                  ? "None of our approved providers match the AI predicted specialties currently."
                  : "There are currently no approved providers listed matching your query."}
              </p>
            </div>
            {(specialty !== "all" ||
              search ||
              aiRecommendedDoctorIds.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-border/60"
                onClick={() => {
                  setSearch("")
                  setSpecialty("all")
                  resetAiFilters()
                }}
              >
                Reset Search Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="border border-border/40 bg-card hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted group-hover:bg-primary transition-colors" />

                <CardHeader className="pb-3">
                  <div className="flex gap-4 items-start justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
                        {doctor.user.name?.[0] || doctor.user.email[0]}
                      </div>
                      <div className="truncate">
                        <CardTitle className="text-base font-bold truncate max-w-[160px] text-foreground">
                          {doctor.user.name || "Doctor"}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="text-[10px] mt-1 py-0.5 px-2 leading-none font-bold"
                        >
                          {doctor.specialty}
                        </Badge>
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
                        {formatPrice(Number(doctor.pricePerVisit))}
                      </strong>
                    </div>
                    {doctor.clinicAddress && (
                      <div className="flex justify-between gap-1 items-start text-muted-foreground pt-1 border-t border-border/10">
                        <span>Location:</span>
                        <span
                          className="text-foreground text-right truncate max-w-[130px]"
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
            <div className="space-y-1.5">
              <Label
                htmlFor="visit-type"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Consultation Type
              </Label>
              <Select
                value={visitType}
                onValueChange={(v: any) => setVisitType(v)}
              >
                <SelectTrigger
                  id="visit-type"
                  className="bg-muted/10 border-border/60"
                >
                  <SelectValue placeholder="Video Consultation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">
                    Video Consultation (Virtual)
                  </SelectItem>
                  <SelectItem value="PHONE">
                    Phone Consultation (Audio)
                  </SelectItem>
                  <SelectItem value="IN_PERSON">
                    In-Person Consultation (Physical Clinic)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date selector */}
            <div className="space-y-1.5">
              <Label
                htmlFor="booking-date"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Select Date
              </Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="booking-date"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value)
                    setSelectedSlot(null)
                  }}
                  className="pl-9 bg-muted/10 border-border/60 font-medium"
                />
              </div>
            </div>

            {/* Slots selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Select Time Slot</span>
                {slotsLoading && (
                  <span className="text-[10px] text-muted-foreground font-normal animate-pulse">
                    Checking availability...
                  </span>
                )}
              </Label>

              {slotsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-9 rounded-lg bg-muted animate-pulse border border-border/40"
                    />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="bg-muted/30 border border-border/25 text-muted-foreground rounded-xl p-4 text-center text-xs font-medium leading-relaxed">
                  No slots available on this date. Doctor may have blocked the
                  day, reached capacity, or schedules are unconfigured. Try
                  another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const startStr = new Date(
                      slot.startTime,
                    ).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "Asia/Manila",
                    })

                    const isSelected =
                      selectedSlot?.startTime === slot.startTime

                    return (
                      <Button
                        key={slot.startTime}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`text-xs h-9 font-semibold ${
                          isSelected
                            ? "shadow-sm"
                            : "border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                        }`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <Clock className="h-3 w-3 mr-1 shrink-0" />
                        {startStr}
                      </Button>
                    )
                  })}
                </div>
              )}
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
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                Data Privacy Act Compliance (RA 10173)
              </h4>
              <p className="text-[10px] text-muted-foreground leading-normal">
                By ticking the consent check box below, you explicitly agree to
                share your medical profile, weight, height, allergies, and
                symptoms with the selected healthcare provider strictly for
                evaluation, diagnosis, and treatment purposes.
              </p>
              <div className="flex items-start gap-2 pt-1">
                <input
                  id="dpa-consent"
                  type="checkbox"
                  checked={dpaConsent}
                  onChange={(e) => setDpaConsent(e.target.checked)}
                  className="h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/20 shrink-0 mt-0.5 cursor-pointer"
                />
                <Label
                  htmlFor="dpa-consent"
                  className="text-[11px] font-medium leading-tight text-foreground/80 cursor-pointer select-none"
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
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
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
