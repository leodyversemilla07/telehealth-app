"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Activity, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react"

export function SecuritySection() {
  return (
    <section id="security" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-muted/50" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge
              variant="outline"
              className="mb-4 rounded-full border-border text-muted-foreground"
            >
              Security & Compliance
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your privacy is
              <br />
              <span className="text-primary">non-negotiable</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              We built Telehealth with healthcare-grade security from day one.
              Every feature is designed to protect your sensitive medical data.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "HIPAA Compliant",
                  description:
                    "Full compliance with healthcare data protection regulations.",
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
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
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
          </div>

          <div className="relative rounded-3xl border border-border bg-card p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-success/15">
                  <CheckCircle2 className="size-5 text-success" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">
                    Session secured
                  </div>
                  <div className="text-xs text-muted-foreground">
                    2FA enabled · Last login 2 min ago
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15">
                  <LockKeyhole className="size-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">
                    Data encrypted
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AES-256 · All records protected
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-warning/15">
                  <ShieldCheck className="size-5 text-warning" />
                </div>
                <div>
                  <div className="text-sm font-medium text-card-foreground">
                    Consent logged
                  </div>
                  <div className="text-xs text-muted-foreground">
                    RA 10173 / PDPA compliant
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
