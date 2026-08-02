"use client"

import { Badge } from "@workspace/ui/components/badge"
import { ShieldCheck, Star } from "lucide-react"
import Image from "next/image"
import { useDoctors } from "@/hooks/use-doctors"

const DOCTORS = [
  {
    name: "Dr. Maria Santos",
    specialty: "General Practice",
    rating: 4.9,
    reviews: 312,
    available: true,
    image: undefined,
  },
  {
    name: "Dr. James Chen",
    specialty: "Internal Medicine",
    rating: 4.8,
    reviews: 287,
    available: true,
    image: undefined,
  },
  {
    name: "Dr. Sarah Williams",
    specialty: "Pediatrics",
    rating: 4.9,
    reviews: 198,
    available: false,
    image: undefined,
  },
  {
    name: "Dr. Michael Brown",
    specialty: "Dermatology",
    rating: 4.7,
    reviews: 156,
    available: true,
    image: undefined,
  },
]

function DoctorCard({
  name,
  specialty,
  rating,
  reviews,
  available,
  image,
  isVerified = false,
}: {
  name: string
  specialty: string
  rating: number
  reviews: number
  available: boolean
  image?: string | null
  isVerified?: boolean
}) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-border/70 bg-card/60 transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5 reveal-on-scroll">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-muted/80 to-muted">
        {image ? (
          <Image
            src={image}
            alt={name}
            unoptimized
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex select-none flex-col items-center gap-3 text-muted-foreground/60">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 font-display text-2xl font-semibold text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
              {name.replace("Dr. ", "").charAt(0)}
            </div>
            {/* Decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-32 rounded-full border border-border/30 transition-all duration-500 group-hover:border-primary/15" />
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold text-card-foreground">
              {name}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm text-muted-foreground">
                {specialty}
              </span>
              {isVerified && (
                <span
                  className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-primary/25 bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary"
                  title="Credentials verified by our admin team"
                >
                  <ShieldCheck className="size-2.5" />
                  Verified
                </span>
              )}
            </div>
          </div>
          <Badge
            className={`shrink-0 rounded-full text-xs ${
              available
                ? "border-success/20 bg-success/15 text-success"
                : "border-border bg-muted text-muted-foreground"
            }`}
            variant="outline"
          >
            {available ? "Available" : "Busy"}
          </Badge>
        </div>
        <div className="mt-3.5 flex items-center gap-1.5 text-sm">
          <Star className="size-4 fill-warning text-warning" />
          <span className="font-medium text-card-foreground">{rating}</span>
          <span className="text-muted-foreground">
            ({reviews} review{reviews !== 1 ? "s" : ""})
          </span>
        </div>
      </div>
    </div>
  )
}

export function DoctorsSection() {
  const { data: dynamicDoctors, isPending: isDoctorsLoading } = useDoctors()

  const doctors = isDoctorsLoading
    ? null
    : dynamicDoctors && dynamicDoctors.length > 0
      ? dynamicDoctors.map((doc) => ({
          name: doc.user.name ?? "Dr. Partner",
          specialty: doc.specialty,
          rating: doc.averageRating ?? 4.8,
          reviews: doc.totalReviews ?? 0,
          available: true,
          image: doc.user.image,
          isVerified: doc.isVerified,
        }))
      : DOCTORS

  return (
    <section
      id="doctors"
      className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32"
    >
      <div className="absolute inset-0 -z-10 bg-muted/50 dark:bg-muted/20" />
      <div className="absolute inset-0 -z-10 bg-dot-grid-subtle opacity-50 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3 py-1 text-xs text-primary">
            Our doctors
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Expert doctors with{" "}
            <span className="italic text-primary">real-world experience</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Board-certified professionals ready to provide quality care from
            anywhere.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isDoctorsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse space-y-4 overflow-hidden rounded-3xl border border-border/70 bg-card p-4"
                >
                  <div className="aspect-square rounded-2xl bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-4 w-1/4 rounded bg-muted" />
                    <div className="h-4 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              ))
            : (doctors ?? []).map((doctor, index) => (
                <DoctorCard key={doctor.name + index} {...doctor} />
              ))}
        </div>
      </div>
    </section>
  )
}
