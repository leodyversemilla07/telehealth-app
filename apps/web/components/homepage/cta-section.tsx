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
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center backdrop-blur-sm sm:p-12">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-card-foreground">
              Ready for better care?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of patients who have switched to faster, more
              convenient healthcare. No hidden fees. No long wait times.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() =>
                  session ? router.push(workspacePath) : router.push("/sign-up")
                }
                className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
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
    </section>
  )
}
