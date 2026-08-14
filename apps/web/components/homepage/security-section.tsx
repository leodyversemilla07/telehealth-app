"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Activity, LockKeyhole, ShieldCheck } from "lucide-react"

const SECURITY_FEATURES = [
  {
    icon: LockKeyhole,
    title: "Account protections",
    description:
      "Email verification, password controls, and optional two-factor authentication help protect accounts.",
  },
  {
    icon: ShieldCheck,
    title: "Access controls",
    description:
      "Authenticated sessions and role-based permissions limit access to platform features.",
  },
  {
    icon: Activity,
    title: "Activity history",
    description:
      "Account and platform actions are recorded to support operational review.",
  },
]

export function SecuritySection() {
  return (
    <section id="security" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-muted/50" />
      <div className="absolute inset-0 -z-10 bg-dot-grid-subtle opacity-50 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center reveal-on-scroll">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3 py-1 text-xs text-primary">
            Security
          </Badge>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Designed with your{" "}
            <span className="italic text-primary">privacy</span> in mind.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Explore the account and access controls available in Telehealth.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3 stagger-children">
          {SECURITY_FEATURES.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card/80 p-6 reveal-on-scroll"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-5 font-medium text-card-foreground">
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
