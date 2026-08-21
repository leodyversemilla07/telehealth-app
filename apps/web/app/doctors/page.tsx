"use client"

import { useQuery } from "@tanstack/react-query"
import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import { Input } from "@workspace/ui/components/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
} from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/lib/trpc/client"

const SPECIALTIES = [
  "All",
  "General Practice",
  "Internal Medicine",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Psychiatry",
  "Neurology",
  "Pulmonology",
  "Gastroenterology",
]

export default function DoctorsDirectoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSpecialty = searchParams.get("specialty") || "All"

  const [search, setSearch] = useState("")
  const [activeSpecialty, setActiveSpecialty] = useState(initialSpecialty)
  const [sortBy, setSortBy] = useState<string>("rating")

  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const { data: dynamicDoctors = [], isPending: isDoctorsLoading } = useQuery(
    trpc.doctors.list.queryOptions({}),
  )

  const user = session?.user as unknown as UserDto | undefined
  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"

  const filteredDoctors = useMemo(() => {
    let result = dynamicDoctors.map((doc) => ({
      id: doc.id,
      name: doc.user.name ?? "Doctor Profile",
      specialty: doc.specialty,
      rating: doc.averageRating,
      reviews: doc.totalReviews,
      image: doc.user.image,
      isVerified: doc.isVerified,
      bio: doc.bio,
    }))

    if (activeSpecialty !== "All") {
      result = result.filter((doc) =>
        doc.specialty?.toLowerCase().includes(activeSpecialty.toLowerCase()),
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          doc.bio?.toLowerCase().includes(q),
      )
    }

    if (sortBy === "rating") {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [dynamicDoctors, activeSpecialty, search, sortBy])

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onSignIn={() => router.push("/sign-in")}
        onSignOut={async () => {
          await authClient.signOut()
          router.refresh()
        }}
        onDashboard={() => router.push(workspacePath)}
      />

      <main className="pt-10 pb-16 sm:pt-14 sm:pb-20 md:pt-16">
        {/* Page Header */}
        <section className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            Physician Directory
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Find the right <span className="text-primary">doctor for you</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            All physicians on Telehealth undergo rigorous medical license
            verification with the Philippine Professional Regulation Commission
            (PRC).
          </p>
        </section>

        {/* Filter & Search Toolbar */}
        <section className="mx-auto mt-12 max-w-7xl px-5 sm:px-8">
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search doctor by name, specialty, or condition..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-xl border-border/80 bg-muted/20 pl-10 pr-4 text-sm"
                />
              </div>

              {/* Sort selector with ToggleGroup */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sort:
                </span>
                <ToggleGroup
                  value={[sortBy]}
                  onValueChange={(val) => {
                    const selected = Array.isArray(val) ? val[0] : val
                    if (selected) setSortBy(selected)
                  }}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem
                    value="rating"
                    className="text-xs font-semibold px-3 py-1.5"
                  >
                    Highest Rated
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="name"
                    className="text-xs font-semibold px-3 py-1.5"
                  >
                    Name (A-Z)
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Specialty Filter Pills */}
            <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-4">
              <span className="text-xs font-semibold text-muted-foreground mr-1">
                Specialty:
              </span>
              {SPECIALTIES.map((spec) => {
                const isActive = activeSpecialty === spec
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setActiveSpecialty(spec)}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "border border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {spec}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Doctor Grid */}
        <section className="mx-auto mt-10 max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isDoctorsLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse space-y-4 rounded-2xl border border-border/70 bg-card p-4"
                  >
                    <div className="aspect-square rounded-xl bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                ))
              : filteredDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div>
                      {/* Doctor avatar / photo */}
                      <div className="relative flex aspect-[4/3] items-center justify-center bg-muted/40 overflow-hidden">
                        {doc.image ? (
                          <Image
                            src={doc.image}
                            alt={doc.name}
                            unoptimized
                            fill
                            className="object-cover transition duration-300 group-hover:scale-102"
                          />
                        ) : (
                          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 font-display text-2xl font-bold text-primary">
                            {doc.name.replace("Dr. ", "").charAt(0)}
                          </div>
                        )}

                        <div className="absolute right-3 top-3 rounded-full border border-border/70 bg-background px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-xs">
                          <span className="inline-block size-1.5 rounded-full bg-success mr-1.5 align-middle" />
                          Available
                        </div>
                      </div>

                      {/* Doctor Details */}
                      <div className="p-5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display text-lg font-bold text-card-foreground truncate">
                            {doc.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-semibold text-primary">
                            {doc.specialty}
                          </span>
                          {doc.isVerified && (
                            <HoverCard>
                              <HoverCardTrigger className="inline-flex items-center gap-0.5 rounded-full border border-primary/25 bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary cursor-pointer hover:bg-primary/20 transition">
                                <ShieldCheck className="size-2.5" />
                                PRC Verified
                              </HoverCardTrigger>
                              <HoverCardContent className="w-72 p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="size-4 text-primary" />
                                  <h4 className="text-xs font-bold text-foreground">
                                    PRC Board Certified Physician
                                  </h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  Medical license and credentials verified with
                                  the Philippine Professional Regulation
                                  Commission & DOH standards.
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary pt-1 border-t border-border/60">
                                  <CheckCircle2 className="size-3" />
                                  <span>Active Good Standing</span>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </div>

                        {doc.bio && (
                          <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                            {doc.bio}
                          </p>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                          <div className="flex items-center gap-1">
                            <Star className="size-4 fill-warning text-warning" />
                            <span className="text-sm font-bold text-foreground">
                              {doc.rating ? doc.rating.toFixed(1) : "New"}
                            </span>
                            {doc.reviews ? (
                              <span className="text-xs text-muted-foreground">
                                ({doc.reviews})
                              </span>
                            ) : null}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Video Visit
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/patient/appointments/book?doctorId=${doc.id}`,
                          )
                        }
                        className="w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm"
                      >
                        Book Appointment
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
          </div>

          {!isDoctorsLoading && filteredDoctors.length === 0 && (
            <div className="mt-12 rounded-2xl border border-border/70 bg-card p-12 text-center">
              <UserCheck className="mx-auto size-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                No doctors found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search keywords or switching specialties.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setActiveSpecialty("All")
                }}
                className="mt-5 rounded-xl"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </section>

        {/* Clinical Assurance Banner */}
        <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
          <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-10 shadow-sm">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <h4 className="font-display font-bold text-foreground">
                  Verified PRC Credentials
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every doctor's license and PTR are manually cross-checked with
                  the Philippine PRC database.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Award className="size-5" />
                </div>
                <h4 className="font-display font-bold text-foreground">
                  Board Certified Specialists
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Consult with accredited fellows and diplomates from top
                  medical institutions.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Star className="size-5" />
                </div>
                <h4 className="font-display font-bold text-foreground">
                  Patient Reviews & Ratings
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Read honest feedback from patients following verified
                  completed consultations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onOpenDashboard={() => router.push(workspacePath)}
      />
    </div>
  )
}
