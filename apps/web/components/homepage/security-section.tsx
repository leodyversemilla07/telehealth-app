"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Activity, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react"

const SECURITY_FEATURES = [
  {
    icon: ShieldCheck,
    title: "HIPAA Compliant",
    description: "Full compliance with healthcare data protection regulations.",
  },
  {
    icon: LockKeyhole,
    title: "End-to-end encryption",
    description:
      "All video calls, messages, and records are encrypted in transit and at rest.",
  },
  {
    icon: Activity,
    title: "Audit logging",
    description:
      "Complete audit trail for all actions. Transparent and accountable.",
  },
]

const STATUS_CARDS = [
  {
    icon: CheckCircle2,
    title: "Session secured",
    description: "2FA enabled · Last login 2 min ago",
    color: "text-success",
    bg: "bg-success/15",
  },
  {
    icon: LockKeyhole,
    title: "Data encrypted",
    description: "AES-256 · All records protected",
    color: "text-primary",
    bg: "bg-primary/15",
  },
  {
    icon: ShieldCheck,
    title: "Consent logged",
    description: "RA 10173 / PDPA compliant",
    color: "text-warning",
    bg: "bg-warning/15",
  },
]

const CERT_BADGES = ["HIPAA", "SOC 2 Type II", "ISO 27001", "PDPA Compliant"]

export function SecuritySection() {
  return (
    <section id="security" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-muted/50" />
      <div className="absolute inset-0 -z-10 bg-dot-grid-subtle opacity-50 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Left column — intro + features */}
          <div className="reveal-on-scroll">
            <Badge
              variant="outline"
              className="mb-4 rounded-full border-border text-muted-foreground"
            >
              Security & Compliance
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your privacy is
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                non-negotiable
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              We built Telehealth with healthcare-grade security from day one.
              Every feature is designed to protect your sensitive medical data.
            </p>

            <div className="mt-8 space-y-4 stagger-children">
              {SECURITY_FEATURES.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="group flex gap-4 rounded-xl p-3 -mx-3 transition-all duration-300 hover:bg-card/50 reveal-on-scroll"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/15 group-hover:scale-105">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-card-foreground">
                        {item.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Certification badges row */}
            <div className="mt-8 flex flex-wrap gap-2 reveal-on-scroll">
              {CERT_BADGES.map((badge) => (
                <Badge
                  key={badge}
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs text-muted-foreground"
                >
                  <CheckCircle2 className="mr-1 size-3 text-primary/60" />
                  {badge}
                </Badge>
              ))}
            </div>
          </div>

          {/* Right column — status cards as a compact bento */}
          <div className="relative rounded-3xl border border-border bg-card/80 p-8 backdrop-blur-sm reveal-on-scroll">
            {/* Subtle glow */}
            <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="space-y-4 stagger-children">
              {STATUS_CARDS.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="group/status flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 transition-all duration-300 hover:border-primary/20 hover:bg-muted/80 reveal-on-scroll"
                  >
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg ${item.bg} transition-all duration-300 group-hover/status:scale-105`}
                    >
                      <Icon className={`size-5 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-card-foreground">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Live indicator */}
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-success/20 bg-success/[0.04] px-4 py-2.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <span className="text-xs text-muted-foreground">
                All systems operational &mdash; end-to-end encryption active
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
