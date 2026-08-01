"use client"

import { Button } from "@workspace/ui/components/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { EcgLine } from "./ecg-line"

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
    <section className="relative py-24 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="reveal-on-scroll">
          <div className="group relative overflow-hidden rounded-[2rem] bg-[oklch(0.28_0.06_225)] px-6 py-16 text-center shadow-2xl shadow-primary/20 sm:px-12 sm:py-20 dark:bg-[oklch(0.22_0.05_225)]">
            {/* atmosphere */}
            <div className="bg-grain absolute inset-0 opacity-[0.06]" />
            <div className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-28 -right-20 size-80 rounded-full bg-warning/10 blur-3xl" />
            <div className="absolute inset-0 bg-dot-grid opacity-[0.12] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent_70%)]" />

            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                Doctors are online now
              </span>

              <h2 className="mt-7 font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Ready for better care?{" "}
                <span className="italic text-white/70">
                  Your doctor's a click away.
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
                Join thousands of patients who switched to faster, more
                convenient healthcare. No hidden fees. No long wait times.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() =>
                    session
                      ? router.push(workspacePath)
                      : router.push("/sign-up")
                  }
                  className="h-13 rounded-full bg-white px-8 text-base font-semibold text-[oklch(0.28_0.06_225)] shadow-xl shadow-black/20 transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98]"
                >
                  {session ? dashboardLabel : "Get started — it's free"}
                  <ArrowRight className="ml-2 size-4.5" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => router.push("/sign-in")}
                  className="h-13 rounded-full px-7 text-base text-white/80 hover:bg-white/10 hover:text-white"
                >
                  Sign in
                </Button>
              </div>

              {/* ECG signature */}
              <div className="mx-auto mt-12 max-w-md text-primary/60">
                <EcgLine className="h-10" strokeClassName="stroke-white/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
