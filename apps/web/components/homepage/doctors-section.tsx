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

export function DoctorsSection() {
  const { data: dynamicDoctors, isPending: isDoctorsLoading } = useDoctors()

  return (
    <section id="doctors" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-muted/50" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center">
          <Badge
            variant="outline"
            className="mb-4 rounded-full border-border text-muted-foreground"
          >
            Our doctors
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Expert doctors with
            <br />
            <span className="text-primary">real-world experience</span>
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
            : (dynamicDoctors && dynamicDoctors.length > 0
                ? dynamicDoctors.map((doc) => ({
                    name: doc.user.name ?? "Dr. Partner",
                    specialty: doc.specialty,
                    rating: doc.averageRating ?? 4.8,
                    reviews: doc.totalReviews ?? 0,
                    available: true,
                    image: doc.user.image,
                  }))
                : DOCTORS
              ).map((doctor, index) => (
                <div
                  key={doctor.name + index}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                    {doctor.image ? (
                      <Image
                        src={doctor.image}
                        alt={doctor.name}
                        unoptimized
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/60 select-none">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                          {doctor.name.replace("Dr. ", "").charAt(0)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-card-foreground">
                          {doctor.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {doctor.specialty}
                        </div>
                      </div>
                      <Badge
                        className={`rounded-full text-xs ${
                          doctor.available
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {doctor.available ? "Available" : "Busy"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Star className="size-4 fill-warning text-warning" />
                      <span className="font-medium text-card-foreground">
                        {doctor.rating}
                      </span>
                      <span className="text-muted-foreground">
                        ({doctor.reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
