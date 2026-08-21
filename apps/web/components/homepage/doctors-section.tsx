"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import { ShieldCheck, Star } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTRPC } from "@/lib/trpc/client"

type DoctorCardProps = {
  id?: string
  name: string
  specialty: string
  rating?: number
  reviews?: number
  image?: string | null
  isVerified?: boolean
}

function DoctorCard({
  id,
  name,
  specialty,
  rating,
  reviews,
  image,
  isVerified = false,
}: DoctorCardProps) {
  const router = useRouter()

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/40">
        {image ? (
          <Image
            src={image}
            alt={name}
            unoptimized
            fill
            className="object-cover transition duration-300 group-hover:scale-102"
          />
        ) : (
          <div className="relative flex select-none flex-col items-center gap-3 text-muted-foreground/60">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 font-display text-2xl font-bold text-primary">
              {name.replace("Dr. ", "").charAt(0)}
            </div>
          </div>
        )}

        <div className="absolute right-3 top-3 rounded-full border border-border/70 bg-background px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
          <span className="inline-block size-1.5 rounded-full bg-success mr-1.5 align-middle" />
          Available
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold text-card-foreground">
              {name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="truncate text-sm text-muted-foreground">
                {specialty}
              </span>
              {isVerified && (
                <HoverCard>
                  <HoverCardTrigger className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-primary/25 bg-primary/10 px-1.5 py-px text-[11px] font-semibold text-primary cursor-pointer hover:bg-primary/20 transition">
                    <ShieldCheck className="size-2.5" />
                    Verified
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <ShieldCheck className="size-3.5 text-primary" />
                      PRC Verified Physician
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      License, PTR, and specialty board credentials verified by
                      our clinical board.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          </div>

          {rating !== undefined ? (
            <div className="mt-3 flex items-center gap-1.5 text-sm">
              <Star className="size-4 fill-warning text-warning" />
              <span className="font-medium text-card-foreground">
                {rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-xs">
                ({reviews ?? 0} review{reviews === 1 ? "" : "s"})
              </span>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No ratings yet</p>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            router.push(
              id
                ? `/patient/appointments/book?doctorId=${id}`
                : `/patient/appointments/book?specialty=${encodeURIComponent(specialty)}`,
            )
          }
          className="mt-4 w-full rounded-xl border-border/80 font-medium transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          Book Consultation
        </Button>
      </div>
    </div>
  )
}

const SPECIALTY_TABS = [
  "All",
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Psychiatry",
  "Neurology",
]

export function DoctorsSection() {
  const [activeSpecialty, setActiveSpecialty] = useState("All")
  const trpc = useTRPC()
  const { data: dynamicDoctors, isPending: isDoctorsLoading } = useQuery(
    trpc.doctors.list.queryOptions({}),
  )

  const allDoctors =
    dynamicDoctors?.map((doc) => ({
      id: doc.id,
      name: doc.user.name ?? "Doctor profile",
      specialty: doc.specialty,
      rating: doc.averageRating,
      reviews: doc.totalReviews,
      image: doc.user.image,
      isVerified: doc.isVerified,
    })) ?? []

  const filteredDoctors =
    activeSpecialty === "All"
      ? allDoctors
      : allDoctors.filter((doc) =>
          doc.specialty?.toLowerCase().includes(activeSpecialty.toLowerCase()),
        )

  return (
    <section
      id="doctors"
      className="relative scroll-mt-24 py-20 sm:py-28 border-t border-border/60"
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-10 text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            Licensed Physicians
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Meet our certified doctors
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Connect with board-certified physicians across primary care and
            specialized medicine.
          </p>

          {/* Specialty Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {SPECIALTY_TABS.map((tab) => {
              const isActive = activeSpecialty === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveSpecialty(tab)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isDoctorsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse space-y-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-4"
                >
                  <div className="aspect-square rounded-xl bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))
            : filteredDoctors.map((doctor, index) => (
                <DoctorCard key={doctor.name + index} {...doctor} />
              ))}
        </div>

        {!isDoctorsLoading && filteredDoctors.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No doctors found for "{activeSpecialty}"
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try selecting "All" or browse other specialties.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
