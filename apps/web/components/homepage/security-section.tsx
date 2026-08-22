"use client"

import { Badge } from "@workspace/ui/components/badge"
import { BadgeCheck, FileCheck, Lock } from "lucide-react"

const SECURITY_FEATURES = [
  {
    icon: BadgeCheck,
    title: "PRC-Verified Credentials",
    description:
      "Every practicing doctor on our platform is verified through active professional medical licenses and credential review.",
  },
  {
    icon: Lock,
    title: "Encrypted Connections",
    description:
      "All video consultations, chat messages, and electronic medical records are transmitted over industry-standard encrypted connections.",
  },
  {
    icon: FileCheck,
    title: "Data Sovereignty & Consent",
    description:
      "You retain complete control of your health records with explicit data access consent controls and transparent audit trails.",
  },
]

export function SecuritySection() {
  return (
    <section
      id="security"
      className="relative py-20 sm:py-28 border-t border-border/60"
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            Trust & Security
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Built for clinical privacy & compliance
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Rigorous security standards and data protection protocols
            safeguarding every patient consultation.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3 stagger-children">
          {SECURITY_FEATURES.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm reveal-on-scroll"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-card-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
