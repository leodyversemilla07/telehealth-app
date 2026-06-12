"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Star } from "lucide-react"

const TESTIMONIALS = [
  {
    quote:
      "I booked an appointment at 10pm and saw a doctor within 15 minutes. The video quality was excellent and I had a prescription by morning.",
    author: "Patient",
    role: "Maria L.",
    rating: 5,
  },
  {
    quote:
      "As a busy parent, being able to consult a pediatrician from home saves us hours. Our kids get quality care without the waiting room stress.",
    author: "Patient",
    role: "David K.",
    rating: 5,
  },
  {
    quote:
      "The platform handles everything — scheduling, video, prescriptions, records. It's the most streamlined telehealth experience I've used.",
    author: "Doctor",
    role: "Dr. Sarah W.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center">
          <Badge
            variant="outline"
            className="mb-4 rounded-full border-border text-muted-foreground"
          >
            Testimonials
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Trusted by thousands of
            <br />
            <span className="text-primary">patients and doctors</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6"
            >
              <div>
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="size-4 fill-warning text-warning"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {testimonial.role.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.author}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
