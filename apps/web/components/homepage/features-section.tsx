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
      className={`group relative overflow-hidden rounded-3xl border p-7 transition-all duration-300 reveal-on-scroll ${
        highlight
          ? "border-primary/25 bg-gradient-to-br from-primary/[0.05] to-primary/[0.01] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 sm:col-span-2 lg:col-span-2"
          : "border-border/70 bg-card/60 hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
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

      {highlight && (
        <div className="pointer-events-none absolute -right-20 -top-20 size-44 rounded-full bg-primary/[0.07] blur-3xl" />
      )}

      <div className="relative">
        <div
          className={`mb-5 flex size-13 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105 ${
            highlight
              ? "bg-primary/15 group-hover:bg-primary/20"
              : "bg-primary/10 group-hover:bg-primary/15"
          }`}
        >
          <Icon className="size-6 text-primary transition-transform duration-300 group-hover:scale-105" />
        </div>
        <h3 className="mb-2.5 font-display text-xl font-semibold text-card-foreground">
          {title}
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-dot-grid-subtle [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3 py-1 text-xs text-primary">
            Features
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Everything you need for{" "}
            <span className="italic text-primary">connected care</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            From booking to follow-up, every step is designed to be fast,
            secure, and effortless.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
