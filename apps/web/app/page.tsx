"use client"

import type { UserDto } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  ArrowRight,
  BadgeCheck,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { authClient } from "@/lib/auth-client"

const FeaturesSection = dynamic(
  () =>
    import("@/components/homepage/features-section").then(
      (m) => m.FeaturesSection,
    ),
  { ssr: false },
)

const SymptomChecker = dynamic(
  () =>
    import("@/components/homepage/symptom-checker").then(
      (m) => m.SymptomChecker,
    ),
  { ssr: false },
)

const DoctorsSection = dynamic(
  () =>
    import("@/components/homepage/doctors-section").then(
      (m) => m.DoctorsSection,
    ),
  { ssr: false },
)

const FAQSection = dynamic(
  () => import("@/components/homepage/faq-section").then((m) => m.FAQSection),
  { ssr: false },
)

const SecuritySection = dynamic(
  () =>
    import("@/components/homepage/security-section").then(
      (m) => m.SecuritySection,
    ),
  { ssr: false },
)

const CTASection = dynamic(
  () => import("@/components/homepage/cta-section").then((m) => m.CTASection),
  { ssr: false },
)

const TRUST_BADGES = [
  { icon: BadgeCheck, label: "PRC-Licensed Doctors" },
  { icon: ShieldCheck, label: "End-to-End Encrypted" },
  { icon: Sparkles, label: "Instant E-Prescriptions" },
]

const QUICK_SPECIALTIES = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Psychiatry",
  "Neurology",
]

function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={className} />
}

export default function Page() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const { data: session, isPending, refetch } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    refetch()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(
        `/patient/appointments/book?search=${encodeURIComponent(searchQuery.trim())}`,
      )
    } else {
      const doctorsEl = document.querySelector("#doctors")
      doctorsEl?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const user = session?.user as unknown as UserDto | undefined
  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"

  const dashboardLabel =
    user?.role === "ADMIN"
      ? "Open admin dashboard"
      : user?.role === "DOCTOR"
        ? "Open doctor workspace"
        : "Open patient dashboard"

  const scrollRef = useScrollReveal()

  return (
    <main ref={scrollRef} className="min-h-svh bg-background text-foreground">
      {/* Fixed global nav */}
      <Header
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onSignIn={() => router.push("/sign-in")}
        onSignOut={handleSignOut}
        onDashboard={() => router.push(workspacePath)}
      />

      {/* ── Minimalist Centered Hero ───────────────────────────────────────── */}
      <section
        id="top"
        className="relative isolate overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-20 md:pt-16"
      >
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          {/* Status Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 py-1.5 text-xs font-semibold text-primary reveal-on-scroll">
            <span className="size-2 rounded-full bg-primary" />
            Licensed Doctors Available Online
          </div>

          {/* Headline */}
          <h1
            className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground reveal-on-scroll"
            style={{ transitionDelay: "60ms" }}
          >
            Connect with Licensed Doctors{" "}
            <span className="text-primary">in Minutes</span>
          </h1>

          {/* Subtitle */}
          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground reveal-on-scroll"
            style={{ transitionDelay: "120ms" }}
          >
            Book a virtual consultation, speak face-to-face in a secure video
            room, and receive official electronic prescriptions—all without the
            waiting room.
          </p>

          {/* Direct Search Bar */}
          <div
            className="mx-auto mt-9 max-w-xl rounded-2xl border border-border/80 bg-card p-2 shadow-sm reveal-on-scroll"
            style={{ transitionDelay: "180ms" }}
          >
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctor name, specialty, or condition..."
                  className="h-11 border-none bg-transparent pl-10 pr-3 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                size="default"
                className="h-11 rounded-xl bg-primary px-6 font-medium shadow-sm"
              >
                Find Doctor
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 px-2 pb-1 border-t border-border/40 pt-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                Popular:
              </span>
              {QUICK_SPECIALTIES.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => {
                    setSearchQuery(spec)
                    router.push(
                      `/patient/appointments/book?specialty=${encodeURIComponent(spec)}`,
                    )
                  }}
                  className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/[0.08] hover:text-primary"
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div
            className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row reveal-on-scroll"
            style={{ transitionDelay: "240ms" }}
          >
            {isPending ? (
              <>
                <SkeletonBlock className="h-12 w-48 rounded-xl" />
                <SkeletonBlock className="h-12 w-32 rounded-xl" />
              </>
            ) : session ? (
              <Button
                size="lg"
                onClick={() => router.push(workspacePath)}
                className="h-12 rounded-xl bg-primary px-8 text-base font-semibold shadow-md shadow-primary/20"
              >
                {dashboardLabel}
                <ArrowRight className="ml-2 size-4.5" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => router.push("/patient/appointments/book")}
                  className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-md shadow-primary/20"
                >
                  Book a Consultation
                  <ArrowRight className="ml-2 size-4.5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/sign-in")}
                  className="h-12 rounded-xl border-border/80 px-7 text-base font-medium hover:bg-muted"
                >
                  Sign in
                </Button>
              </>
            )}
          </div>

          {/* Trust bullet row */}
          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border/60 pt-8 reveal-on-scroll"
            style={{ transitionDelay: "300ms" }}
          >
            {TRUST_BADGES.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"
              >
                <b.icon className="size-4 text-primary" />
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <FeaturesSection />
      <SymptomChecker />
      <DoctorsSection />
      <FAQSection />
      <SecuritySection />
      <CTASection
        session={Boolean(session)}
        workspacePath={workspacePath}
        dashboardLabel={dashboardLabel}
      />

      <Footer
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onOpenDashboard={() => router.push(workspacePath)}
      />
    </main>
  )
}
