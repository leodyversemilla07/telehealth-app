"use client"

import type { DoctorProfileDto } from "@workspace/shared"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  ChevronDown,
  DollarSign,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react"
import Link from "next/link"
import type { ChangeEvent } from "react"
import { useDeferredValue, useState } from "react"
import { toast } from "sonner"
import { useDoctors } from "@/hooks/use-doctors"
import { useRecommendation } from "@/hooks/use-recommendations"

// ── Specialty options ────────────────────────────────────────────────────────

const SPECIALTIES = [
  "General Practice",
  "Internal Medicine",
  "Pediatrics",
  "OB-GYN",
  "Psychiatry",
  "Dermatology",
  "Cardiology",
  "Orthopedics",
] as const

// ── Price formatter (Philippine Peso) ────────────────────────────────────────

const priceFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

// ── Sort type ────────────────────────────────────────────────────────────────

type SortOption = "name" | "price"

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DoctorCardSkeleton() {
  return (
    <Card className="animate-pulse bg-card/60 border-border/40">
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        <div className="h-14 w-14 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 py-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-5 w-24 bg-muted rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-2">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="h-8 w-32 bg-muted rounded" />
      </CardFooter>
    </Card>
  )
}

// ── Doctor card ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor }: { doctor: DoctorProfileDto }) {
  const name = doctor.user?.name || "Doctor"
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const specialty = doctor.specialty || "General Practice"
  const bioSnippet =
    doctor.bio && doctor.bio.length > 120
      ? `${doctor.bio.slice(0, 120)}…`
      : doctor.bio || null

  return (
    <Card className="group relative overflow-hidden border border-border/40 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 bg-card transition-all duration-300">
      {/* Top accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 to-primary/20" />

      <CardHeader className="flex flex-row items-start gap-4 pb-3 pt-5">
        {/* Avatar */}
        <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 overflow-hidden">
          {doctor.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doctor.user.image}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <CardTitle className="truncate text-base font-semibold text-foreground">
            {name}
          </CardTitle>
          <CardDescription className="text-xs truncate flex items-center gap-1.5">
            <Stethoscope className="h-3 w-3 text-primary/70 shrink-0" />
            {specialty}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-2">
        {/* Bio snippet */}
        {bioSnippet && (
          <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
            {bioSnippet}
          </p>
        )}

        {/* Price & credentials */}
        <div className="flex flex-wrap items-center gap-2">
          {doctor.prcLicenseNumber && (
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
            >
              <BadgeCheck className="h-3 w-3 mr-0.5" />
              PRC {doctor.prcLicenseNumber}
            </Badge>
          )}
          {doctor.pricePerVisit > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
            >
              <DollarSign className="h-3 w-3 mr-0.5" />
              {priceFormatter.format(doctor.pricePerVisit)}/visit
            </Badge>
          )}
          {doctor.clinicAddress && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium text-muted-foreground"
            >
              <MapPin className="h-3 w-3 mr-0.5" />
              {doctor.clinicAddress.length > 30
                ? `${doctor.clinicAddress.slice(0, 30)}…`
                : doctor.clinicAddress}
            </Badge>
          )}
        </div>
      </CardContent>

      <Separator className="!mt-2" />

      <CardFooter className="flex items-center gap-2 !pt-3 !pb-4">
        <Link href={`/doctors/${doctor.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[11px] gap-1.5 h-8 font-medium"
          >
            View Profile
          </Button>
        </Link>
        <Link
          href={`/appointments/book?doctorId=${doctor.id}`}
          className="flex-1"
        >
          <Button
            size="sm"
            className="w-full text-[11px] gap-1.5 h-8 font-medium shadow-sm shadow-primary/10"
          >
            <Calendar className="h-3.5 w-3.5" />
            Book Appointment
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

// ── AI Recommendation Card ──────────────────────────────────────────────────

function AiRecommendationCard() {
  const [expanded, setExpanded] = useState(false)
  const [symptoms, setSymptoms] = useState("")
  const recommendation = useRecommendation()

  const handleSubmit = () => {
    const trimmed = symptoms.trim()
    if (!trimmed) return
    recommendation.mutate({ symptoms: trimmed })
  }

  const result = recommendation.data

  return (
    <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground">
            AI Doctor Recommendation
          </CardTitle>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Expandable content */}
      {expanded && (
        <CardContent className="px-6 pb-6 pt-0 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Describe your symptoms and our AI will recommend the right specialties and doctors for you.
          </p>

          {/* Symptoms textarea + submit */}
          <div className="space-y-2">
            <Textarea
              placeholder="e.g. I've been having persistent headaches and blurred vision for the past week..."
              value={symptoms}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSymptoms(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            <Button
              onClick={handleSubmit}
              disabled={recommendation.isPending || !symptoms.trim()}
              size="sm"
              className="gap-2"
            >
              {recommendation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Get Recommendation
                </>
              )}
            </Button>
          </div>

          {/* Error state */}
          {recommendation.isError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold text-sm">Recommendation failed</h4>
                <p className="text-xs text-destructive/80 leading-relaxed">
                  {recommendation.error?.message || "Something went wrong. Please try again."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs gap-1.5 h-7"
                onClick={handleSubmit}
                disabled={recommendation.isPending}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Matched specialties */}
              {result.specialties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Matched Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.specialties.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 font-medium"
                      >
                        <Stethoscope className="h-3 w-3 mr-1" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended doctor cards */}
              {result.doctors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recommended Doctors
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.doctors.map((doctor) => (
                      <DoctorCard
                        key={doctor.id}
                        doctor={doctor as DoctorProfileDto}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No matches */}
              {result.specialties.length === 0 && result.doctors.length === 0 && (
                <div className="bg-card border border-border/40 rounded-lg p-6 text-center space-y-2">
                  <Stethoscope className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    No matching specialties or doctors found for your symptoms.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DoctorDiscoveryPage() {
  const [searchInput, setSearchInput] = useState("")
  const [specialty, setSpecialty] = useState<string>("all")
  const [sort, setSort] = useState<SortOption>("name")

  // Deferred search for server-side debouncing
  const deferredSearch = useDeferredValue(searchInput)

  // Server-side filtered query via useDoctors hook
  const params = {
    specialty: specialty !== "all" ? specialty : undefined,
    search: deferredSearch.trim() || undefined,
    sort,
  }

  const { data: doctors, isPending, error } = useDoctors(params)

  const resultCount = doctors?.length ?? 0

  // ── Show error toast ─────────────────────────────────────────────────────

  if (error) {
    toast.error(error.message || "Failed to load doctors.")
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Find Doctors
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse verified healthcare providers and book your next appointment.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 sm:mt-0">
          <Stethoscope className="h-4 w-4 text-primary" />
          {!isPending && resultCount > 0 && (
            <span>
              {resultCount} doctor{resultCount !== 1 ? "s" : ""} available
            </span>
          )}
          {!isPending && resultCount === 0 && (deferredSearch || specialty !== "all") && (
            <span>No matches</span>
          )}
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or specialty..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 pr-9 h-10"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Filters row: Specialty select + Sort toggle ─────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Specialty dropdown */}
        <div className="flex items-center gap-2 sm:w-64">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            Specialty
          </label>
          <Select value={specialty} onValueChange={(v: string | null) => { if (v != null) setSpecialty(v) }}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {SPECIALTIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            Sort by
          </label>
          <div className="inline-flex items-center rounded-lg border border-border/40 bg-card p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setSort("name")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === "name"
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              }`}
            >
              <UserRound className="h-3 w-3" />
              Name
            </button>
            <button
              type="button"
              onClick={() => setSort("price")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === "price"
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              }`}
            >
              <DollarSign className="h-3 w-3" />
              Price
            </button>
          </div>
        </div>

        {/* Clear filters (when any active) */}
        {(specialty !== "all" || searchInput) && (
          <button
            type="button"
            onClick={() => {
              setSpecialty("all")
              setSearchInput("")
            }}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>

      <Separator />

      {/* ── AI Doctor Recommendation ──────────────────────────────────── */}
      <AiRecommendationCard />

      {/* ── Loading skeletons ───────────────────────────────────────────── */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton has no stable id
            <DoctorCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Failed to load doctors</h3>
            <p className="text-xs text-destructive/80 leading-relaxed">
              {error.message ||
                "An unexpected error occurred while fetching doctors. Please try again."}
            </p>
          </div>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!isPending && !error && resultCount === 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-foreground">
              {deferredSearch || specialty !== "all"
                ? "No doctors match your search"
                : "No doctors available"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {deferredSearch || specialty !== "all"
                ? "Try adjusting your search or filters to find available doctors."
                : "There are currently no approved doctors on the platform. Check back later."}
            </p>
          </div>
          {(deferredSearch || specialty !== "all") && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => {
                setSearchInput("")
                setSpecialty("all")
              }}
            >
              <X className="h-3.5 w-3.5" />
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* ── Doctor cards grid ───────────────────────────────────────────── */}
      {!isPending && !error && resultCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors!.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  )
}
