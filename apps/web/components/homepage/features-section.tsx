"use client"

import { Badge } from "@workspace/ui/components/badge"
import {
  CalendarClock,
  ClipboardList,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Video,
} from "lucide-react"

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Smart scheduling",
    description:
      "See real-time doctor availability, visit types, and fees. Book appointments in under 60 seconds.",
  },
  {
    icon: Video,
    title: "Secure video visits",
    description:
      "HD video consultations with built-in controls. No downloads required — works right in your browser.",
  },
  {
    icon: ClipboardList,
    title: "Digital prescriptions",
    description:
      "Receive prescriptions instantly after your visit. Download, save, or send directly to your pharmacy.",
  },
  {
    icon: FileText,
    title: "Medical records",
    description:
      "Access your complete health history anytime. Share records securely with new providers.",
  },
  {
    icon: MessageSquareText,
    title: "Secure messaging",
    description:
      "Follow up with your doctor via encrypted chat. Ask questions, share updates, get clarity.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy first",
    description:
      "End-to-end encryption, consent controls, and full audit logs. Your data stays yours.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center">
          <Badge
            variant="outline"
            className="mb-4 rounded-full border-border text-muted-foreground"
          >
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need for
            <br />
            <span className="text-primary">connected care</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From booking to follow-up, every step is designed to be fast,
            secure, and effortless.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30 hover:bg-card/80"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
