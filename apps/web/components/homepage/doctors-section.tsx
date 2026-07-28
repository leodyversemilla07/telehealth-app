"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Star } from "lucide-react"
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
}: {
  name: string
  specialty: string
  rating: number
  reviews: number
  available: boolean
  image?: string | null
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card/50 transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5 reveal-on-scroll">
      <div className="aspect-square bg-gradient-to-br from-muted/80 to-muted relative overflow-hidden flex items-center justify-center">
        {image ? (
          <Image
            src={image}
            alt={name}
            unoptimized
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex flex-col items-center gap-2 text-muted-foreground/60 select-none">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15">
              {name.replace("Dr. ", "").charAt(0)}
            </div>
            {/* Decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-32 rounded-full border border-border/30 group-hover:border-primary/10 transition-all duration-500" />
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-card-foreground truncate">
              {name}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {specialty}
            </div>
          </div>
          <Badge
            className={`shrink-0 rounded-full text-xs ${
              available
                ? "bg-success/15 text-success border-success/20"
                : "bg-muted text-muted-foreground border-border"
            }`}
            variant="outline"
          >
            {available ? "Available" : "Busy"}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-sm">
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
        }))
      : DOCTORS

  return (
    <section id="doctors" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-muted/50" />
      <div className="absolute inset-0 -z-10 bg-dot-grid-subtle opacity-50 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center reveal-on-scroll">
          <Badge
            variant="outline"
            className="mb-4 rounded-full border-border text-muted-foreground"
          >
            Our doctors
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Expert doctors with
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              real-world experience
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Board-certified professionals ready to provide quality care from
            anywhere.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isDoctorsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border bg-card p-4 space-y-4 animate-pulse"
                >
                  <div className="aspect-square bg-muted rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-4 w-1/4 bg-muted rounded" />
                    <div className="h-4 w-1/3 bg-muted rounded" />
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
