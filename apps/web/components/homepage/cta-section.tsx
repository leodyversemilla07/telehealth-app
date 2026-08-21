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
    <section className="relative py-20 sm:py-24 border-t border-border/60">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-12 text-center shadow-sm">
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <span className="size-2 rounded-full bg-primary" />
              Licensed Physicians Ready
            </span>

            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
              Ready to speak with a doctor?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Skip the commute and the waiting room. Book your virtual
              consultation in under a minute.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() =>
                  session ? router.push(workspacePath) : router.push("/sign-up")
                }
                className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                {session ? dashboardLabel : "Book a Consultation"}
                <ArrowRight className="ml-2 size-4.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  router.push(session ? workspacePath : "/sign-in")
                }
                className="h-12 rounded-xl border-border/80 px-7 text-base font-medium hover:bg-muted"
              >
                {session ? "View Appointments" : "Sign In to Account"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
