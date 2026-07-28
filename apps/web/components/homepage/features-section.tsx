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
    highlight: true,
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

function FeatureCard({
  icon: Icon,
  title,
  description,
  highlight,
}: {
  icon: typeof CalendarClock
  title: string
  description: string
  highlight?: boolean
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 reveal-on-scroll ${
        highlight
          ? "border-primary/20 bg-gradient-to-br from-primary/[0.04] to-primary/[0.01] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 sm:col-span-2 lg:col-span-2"
          : "border-border bg-card/50 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
      }`}
    >
      {/* Hover accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-0.5 transition-colors duration-300 ${
          highlight
            ? "bg-primary/30 group-hover:bg-primary/60"
            : "bg-primary/0 group-hover:bg-primary/40"
        }`}
      />

      {/* Decorative glow on highlight card */}
      {highlight && (
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl" />
      )}

      <div className="relative">
        <div
          className={`mb-4 flex size-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 ${
            highlight
              ? "bg-primary/15 group-hover:bg-primary/20"
              : "bg-primary/10 group-hover:bg-primary/15"
          }`}
        >
          <Icon className="size-6 text-primary transition-transform duration-300 group-hover:scale-105" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-card-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      {/* Subtle dot grid backdrop */}
      <div className="absolute inset-0 -z-10 bg-dot-grid-subtle [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center reveal-on-scroll">
          <Badge
            variant="outline"
            className="mb-4 rounded-full border-border text-muted-foreground"
          >
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need for
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              connected care
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From booking to follow-up, every step is designed to be fast,
            secure, and effortless.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
