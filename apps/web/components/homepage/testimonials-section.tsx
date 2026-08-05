"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Star } from "lucide-react"

const TESTIMONIALS = [
  {
    quote:
      "I booked an appointment at 10pm and saw a doctor within 15 minutes. The video quality was excellent and I had a prescription by morning.",
    author: "Maria L.",
    role: "Patient",
    rating: 5,
    featured: true,
  },
  {
    quote:
      "As a busy parent, being able to consult a pediatrician from home saves us hours. Our kids get quality care without the waiting room stress.",
    author: "David K.",
    role: "Patient",
    rating: 5,
  },
  {
    quote:
      "The platform handles everything — scheduling, video, prescriptions, records. It's the most streamlined telehealth experience I've used.",
    author: "Dr. Sarah W.",
    role: "Doctor",
    rating: 5,
  },
]

function TestimonialCard({
  quote,
  author,
  role,
  rating,
  featured,
}: {
  quote: string
  author: string
  role: string
  rating: number
  featured?: boolean
}) {
  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 reveal-on-scroll ${
        featured
          ? "border-primary/20 bg-gradient-to-br from-primary/[0.04] to-primary/[0.01] sm:col-span-2 lg:col-span-2 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
          : "border-border bg-card/50 hover:border-primary/20 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
      }`}
    >
      {/* Decorative quote mark */}
      <div
        className={`pointer-events-none absolute select-none text-6xl leading-none font-serif transition-all duration-300 ${
          featured
            ? "-right-1 -top-3 text-primary/[0.08] group-hover:text-primary/[0.12]"
            : "-right-2 -top-2 text-primary/5 group-hover:text-primary/10"
        }`}
        aria-hidden="true"
      >
        &ldquo;
      </div>

      {/* Featured glow */}
      {featured && (
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-primary/[0.04] blur-3xl" />
      )}

      <div className="relative z-10">
        <div className="mb-4 flex gap-1">
          {Array.from({ length: rating }).map((_, j) => (
            <Star key={j} className="size-4 fill-warning text-warning" />
          ))}
        </div>
        <p
          className={`leading-relaxed relative z-10 ${
            featured ? "text-base" : "text-sm"
          } text-muted-foreground`}
        >
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      <div className="relative z-10 mt-6 flex items-center gap-3">
        <div
          className={`flex items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-all duration-300 group-hover:bg-primary/15 ${
            featured ? "size-12 text-base" : "size-10"
          } group-hover:scale-105`}
        >
          {featured ? (
            <span className="text-lg">{author.charAt(0)}</span>
          ) : (
            author.charAt(0)
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-card-foreground">
            {author}
          </div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden scroll-mt-24 py-24 sm:py-32"
    >
      <div className="absolute inset-0 -z-10 bg-dot-grid-subtle [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3 py-1 text-xs text-primary">
            Testimonials
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Trusted by thousands of{" "}
            <span className="italic text-primary">patients and doctors</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {TESTIMONIALS.map((testimonial, i) => (
            <TestimonialCard key={i} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
