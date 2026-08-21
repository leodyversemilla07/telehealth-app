"use client"

import { Badge } from "@workspace/ui/components/badge"
import {
  CalendarCheck,
  FileText,
  Lock,
  Pill,
  Sparkles,
  UserCheck,
  Video,
} from "lucide-react"

const STEPS = [
  {
    step: "01",
    title: "Find Your Specialist",
    description:
      "Search licensed physicians by specialty, symptoms, or availability. Compare ratings and consultation fees transparently.",
    icon: UserCheck,
  },
  {
    step: "02",
    title: "Join Secure Video Call",
    description:
      "Connect face-to-face right in your web browser or phone. No app downloads required—completely private and encrypted.",
    icon: Video,
  },
  {
    step: "03",
    title: "Get Prescriptions & Records",
    description:
      "Receive official digital prescriptions, medical notes, and lab referrals immediately saved to your health portal.",
    icon: FileText,
  },
]

const KEY_BENEFITS = [
  {
    icon: CalendarCheck,
    title: "Real-Time Scheduling",
    desc: "Book available doctor slots in under 60 seconds with instant calendar confirmation.",
  },
  {
    icon: Pill,
    title: "Digital E-Prescriptions",
    desc: "Legally compliant e-prescriptions ready to present at any licensed pharmacy.",
  },
  {
    icon: Lock,
    title: "HIPAA-Level Privacy",
    desc: "End-to-end encrypted consultations with full patient data sovereignty and audit logs.",
  },
  {
    icon: Sparkles,
    title: "AI-Assisted Guidance",
    desc: "Intelligent symptom triage helps you find the right medical specialty in seconds.",
  },
]

export function FeaturesSection() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 py-20 sm:py-28 border-t border-border/60"
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section Header */}
        <div className="mb-14 text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            How It Works
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Healthcare made simple in{" "}
            <span className="text-primary">3 steps</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            From booking your consultation to receiving your prescription, the
            entire process is effortless.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid gap-6 md:grid-cols-3 stagger-children">
          {STEPS.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md reveal-on-scroll"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-2xl font-bold text-primary/80">
                      {item.step}
                    </span>
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Secondary Benefit Grid */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {KEY_BENEFITS.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className="rounded-xl border border-border/60 bg-muted/20 p-5 reveal-on-scroll"
              >
                <Icon className="size-5 text-primary mb-3" />
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  {benefit.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
