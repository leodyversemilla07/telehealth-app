"use client"

import type { UserDto } from "@workspace/shared"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Video,
  VideoOff,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { EcgLine } from "@/components/homepage/ecg-line"
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

const TestimonialsSection = dynamic(
  () =>
    import("@/components/homepage/testimonials-section").then(
      (m) => m.TestimonialsSection,
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
  { icon: ShieldCheck, label: "HIPAA-ready" },
  { icon: BadgeCheck, label: "Licensed doctors" },
  { icon: Sparkles, label: "AI symptom check" },
]

function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={className} />
}

/** Floating "live consultation" product mock — visual proof of the product. */
function LiveConsultMock() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* ambient ring */}
      <div className="absolute -inset-8 -z-10 rounded-full bg-primary/[0.06] blur-3xl dark:bg-primary/[0.09]" />

      <div className="animate-float overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-2xl shadow-primary/10 dark:border-white/10">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-warning/70" />
            <span className="size-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            tele-health.app · consultation
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
            <span className="size-1.5 animate-pulse-ring rounded-full bg-success" />
            Live
          </span>
        </div>

        {/* video surface */}
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/[0.10] via-card to-primary/[0.05]">
          <div className="bg-grain absolute inset-0 opacity-[0.35]" />
          <Avatar className="size-20 border-4 border-background shadow-xl">
            <AvatarFallback className="bg-primary/15 font-display text-3xl text-primary">
              MS
            </AvatarFallback>
          </Avatar>
          <div className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md">
            Dr. Maria Santos · General Practice
          </div>
          <div className="absolute bottom-4 right-4 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md">
            02:14 elapsed
          </div>
          {/* heartbeat trace over the video */}
          <EcgLine className="absolute inset-x-6 bottom-10 h-8 opacity-80" />
        </div>

        {/* controls */}
        <div className="flex items-center justify-center gap-3 px-5 py-4">
          {[
            { icon: Mic, label: "Mute" },
            { icon: Video, label: "Camera" },
            { icon: PhoneOff, label: "End", danger: true },
            { icon: MicOff, label: "Muted", active: true },
            { icon: VideoOff, label: "Camera off", active: true },
          ]
            .slice(0, 3)
            .map((c) => (
              <button
                key={c.label}
                type="button"
                aria-label={c.label}
                className={`flex size-11 items-center justify-center rounded-full border transition ${
                  c.danger
                    ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    : "border-border/70 bg-muted/60 text-foreground hover:bg-muted"
                }`}
              >
                <c.icon className="size-4.5" />
              </button>
            ))}
        </div>
      </div>

      {/* floating chip: wait time */}
      <div className="animate-float absolute -left-4 bottom-16 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/90 px-4 py-3 shadow-xl backdrop-blur-md [animation-delay:1.2s] dark:bg-card/90 dark:border-white/10">
        <span className="flex size-9 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Timer className="size-4.5" />
        </span>
        <div>
          <div className="text-xs font-semibold text-foreground">
            You're next
          </div>
          <div className="text-[11px] text-muted-foreground">~4 min wait</div>
        </div>
      </div>

      {/* floating chip: rating */}
      <div className="animate-float absolute -right-3 top-24 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/90 px-4 py-3 shadow-xl backdrop-blur-md [animation-delay:0.6s] dark:bg-card/90 dark:border-white/10">
        <span className="flex size-9 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Star className="size-4.5 fill-current" />
        </span>
        <div>
          <div className="text-xs font-semibold text-foreground">
            4.9 rating
          </div>
          <div className="text-[11px] text-muted-foreground">312 reviews</div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const router = useRouter()
  const { data: session, isPending, refetch } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    refetch()
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
    <main
      ref={scrollRef}
      className="min-h-svh bg-[oklch(0.984_0.004_95)] text-foreground dark:bg-background"
    >
      {/* Fixed global nav — must live OUTSIDE the isolated hero section so its
          z-index applies page-wide (inside a stacking context it would be
          painted over by later sections while scrolling). */}
      <Header
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onSignIn={() => router.push("/sign-in")}
        onSignOut={handleSignOut}
        onDashboard={() => router.push(workspacePath)}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="top" className="relative isolate overflow-hidden">
        {/* atmosphere */}
        <div className="absolute inset-0 -z-10 bg-dot-grid [mask-image:radial-gradient(ellipse_90%_60%_at_60%_0%,black,transparent_75%)] opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent dark:from-primary/[0.10]" />
        <div className="absolute -left-40 top-10 -z-10 size-[34rem] rounded-full bg-primary/[0.05] blur-3xl dark:bg-primary/[0.08]" />
        <div className="absolute -right-32 top-48 -z-10 size-[28rem] rounded-full bg-warning/[0.05] blur-3xl" />
        <div className="bg-grain absolute inset-0 -z-10 opacity-[0.05] dark:opacity-[0.03]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28 lg:pt-40">
          {/* Left — copy + CTAs */}
          <div className="text-center lg:text-left">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-4 py-1.5 text-xs font-medium tracking-wide text-primary reveal-on-scroll">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Consult with licensed doctors — 24/7
            </div>

            <div
              className="reveal-on-scroll"
              style={{ transitionDelay: "80ms" }}
            >
              <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
                Care that meets you{" "}
                <span className="italic text-primary">wherever</span> you are.
              </h1>
            </div>

            <div
              className="reveal-on-scroll"
              style={{ transitionDelay: "160ms" }}
            >
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                Book a consultation, talk to your doctor face-to-face in a
                secure video room, and get your prescription — all without the
                waiting room. In the Philippines, or anywhere else.
              </p>
            </div>

            <div
              className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:justify-start reveal-on-scroll"
              style={{ transitionDelay: "240ms" }}
            >
              {isPending ? (
                <>
                  <SkeletonBlock className="h-13 w-48" />
                  <SkeletonBlock className="h-13 w-32" />
                </>
              ) : session ? (
                <Button
                  size="lg"
                  onClick={() => router.push(workspacePath)}
                  className="h-13 rounded-full bg-primary px-8 text-base shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
                >
                  {dashboardLabel}
                  <ArrowRight className="ml-2 size-4.5" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => router.push("/sign-up")}
                    className="h-13 rounded-full bg-primary px-8 text-base shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
                  >
                    Get started — it's free
                    <ArrowRight className="ml-2 size-4.5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => router.push("/sign-in")}
                    className="h-13 rounded-full px-7 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>

            {/* trust badges */}
            <div
              className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start reveal-on-scroll"
              style={{ transitionDelay: "320ms" }}
            >
              {TRUST_BADGES.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <b.icon className="size-4 text-primary" />
                  {b.label}
                </span>
              ))}
            </div>

            {/* stats */}
            <div
              className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:mt-14 reveal-on-scroll"
              style={{ transitionDelay: "400ms" }}
            >
              {[
                ["50K+", "patients cared for"],
                ["200+", "licensed doctors"],
                ["15K+", "visits every month"],
                ["4.9★", "average rating"],
              ].map(([value, label]) => (
                <div key={label} className="text-left">
                  <div className="font-display text-3xl font-semibold text-foreground">
                    {value}
                  </div>
                  <div className="mt-1 text-xs leading-snug text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live consultation mock */}
          <div
            className="reveal-on-scroll lg:pl-6"
            style={{ transitionDelay: "200ms" }}
          >
            <LiveConsultMock />
          </div>
        </div>

        {/* ECG signature divider */}
        <div className="mx-auto max-w-5xl px-8 pb-10 opacity-80">
          <EcgLine className="h-12 text-primary" />
        </div>
      </section>

      <FeaturesSection />
      <SymptomChecker />
      <DoctorsSection />
      <TestimonialsSection />
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
