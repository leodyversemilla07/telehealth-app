"use client"

import { Button } from "@workspace/ui/components/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface CTASectionProps {
  session: boolean
  workspacePath: string
  dashboardLabel: string
}

export function CTASection({
  session,
  workspacePath,
  dashboardLabel,
}: CTASectionProps) {
  const router = useRouter()

  return (
    <section className="relative py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="reveal-on-scroll">
          <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-8 text-center backdrop-blur-sm sm:p-12 lg:p-16">
            {/* Animated gradient border */}
            <div
              className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, oklch(0.55 0.12 210 / 0.3), transparent 30%, transparent 70%, oklch(0.55 0.12 210 / 0.3), transparent)",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1px",
                animation: "spin 4s linear infinite",
              }}
            />

            {/* Background gradient mesh */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.03]" />
            <div className="absolute -left-20 -top-20 -z-10 h-60 w-60 rounded-full bg-primary/[0.04] blur-3xl" />
            <div className="absolute -bottom-20 -right-20 -z-10 h-60 w-60 rounded-full bg-primary/[0.04] blur-3xl" />

            {/* Dot grid overlay */}
            <div className="absolute inset-0 -z-10 bg-dot-grid opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent_70%)]" />

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-card-foreground">
                Ready for better care?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Join thousands of patients who have switched to faster, more
                convenient healthcare. No hidden fees. No long wait times.
              </p>

              {/* Live social proof */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40" />
                    <span className="relative inline-flex size-2 rounded-full bg-success" />
                  </span>
                  200+ doctors online now
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">4.9</span>
                  avg. patient rating
                </span>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() =>
                    session
                      ? router.push(workspacePath)
                      : router.push("/sign-up")
                  }
                  className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {session ? dashboardLabel : "Get started free"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => router.push("/sign-in")}
                  className="rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
