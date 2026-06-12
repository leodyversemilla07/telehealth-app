"use client"

import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"

const FeaturesSection = dynamic(
  () =>
    import("@/components/homepage/features-section").then(
      (m) => m.FeaturesSection,
    ),
  { ssr: false, loading: () => <div className="py-24" /> },
)

const DoctorsSection = dynamic(
  () =>
    import("@/components/homepage/doctors-section").then(
      (m) => m.DoctorsSection,
    ),
  { ssr: false, loading: () => <div className="py-24" /> },
)

const TestimonialsSection = dynamic(
  () =>
    import("@/components/homepage/testimonials-section").then(
      (m) => m.TestimonialsSection,
    ),
  { ssr: false, loading: () => <div className="py-24" /> },
)

const SecuritySection = dynamic(
  () =>
    import("@/components/homepage/security-section").then(
      (m) => m.SecuritySection,
    ),
  { ssr: false, loading: () => <div className="py-24" /> },
)

const CTASection = dynamic(
  () => import("@/components/homepage/cta-section").then((m) => m.CTASection),
  { ssr: false, loading: () => <div className="py-24" /> },
)

const TRUST_BADGES = [
  "HIPAA Compliant",
  "256-bit Encryption",
  "Board Certified Doctors",
]

function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={className} />
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

  return (
    <main className="min-h-svh bg-background text-foreground">
      {/* Hero Section */}
      <section id="top" className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background dark:from-primary/10 dark:via-background dark:to-background" />

        <Header
          isAuthenticated={Boolean(session)}
          onCreateAccount={() => router.push("/sign-up")}
          onSignIn={() => router.push("/sign-in")}
          onSignOut={handleSignOut}
          onDashboard={() => router.push(workspacePath)}
        />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-24 pt-16 text-center sm:px-8 lg:pb-32 lg:pt-24">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {TRUST_BADGES.map((badge) => (
              <Badge
                key={badge}
                className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                <CheckCircle2 className="mr-1 size-3" />
                {badge}
              </Badge>
            ))}
          </div>

          <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-foreground">Care moves faster</span>
            <br />
            <span className="text-primary">when every handoff is visible.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A telehealth workspace for booking, secure video visits, doctor
            schedules, prescriptions, and patient notifications. Built for
            patients who value their time.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            {isPending ? (
              <>
                <SkeletonBlock className="h-12 w-44" />
                <SkeletonBlock className="h-12 w-36" />
              </>
            ) : session ? (
              <Button
                size="lg"
                onClick={() => router.push(workspacePath)}
                className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
              >
                {dashboardLabel}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => router.push("/sign-up")}
                  className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                >
                  Get started free
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => router.push("/sign-in")}
                  className="rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <FeaturesSection />
      <DoctorsSection />
      <TestimonialsSection />
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
