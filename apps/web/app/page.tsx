"use client"

import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Star,
  Video,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { useDoctors } from "@/hooks/use-doctors"
import { authClient } from "@/lib/auth-client"

const TRUST_BADGES = [
  "HIPAA Compliant",
  "256-bit Encryption",
  "Board Certified Doctors",
]

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Smart scheduling",
    description:
      "See real-time doctor availability, visit types, and fees. Book appointments in under 60 seconds.",
  },
  {
    icon: Video,
    title: "Secure video visits",
    description:
      "HD video consultations with built-in controls. No downloads required — works right in your browser.",
  },
  {
    icon: ClipboardList,
    title: "Digital prescriptions",
    description:
      "Receive prescriptions instantly after your visit. Download, save, or send directly to your pharmacy.",
  },
  {
    icon: FileText,
    title: "Medical records",
    description:
      "Access your complete health history anytime. Share records securely with new providers.",
  },
  {
    icon: MessageSquareText,
    title: "Secure messaging",
    description:
      "Follow up with your doctor via encrypted chat. Ask questions, share updates, get clarity.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy first",
    description:
      "End-to-end encryption, consent controls, and full audit logs. Your data stays yours.",
  },
]

const DOCTORS = [
  {
    name: "Dr. Maria Santos",
    specialty: "General Practice",
    rating: 4.9,
    reviews: 312,
    available: true,
    image: undefined,
  },
  {
    name: "Dr. James Chen",
    specialty: "Internal Medicine",
    rating: 4.8,
    reviews: 287,
    available: true,
    image: undefined,
  },
  {
    name: "Dr. Sarah Williams",
    specialty: "Pediatrics",
    rating: 4.9,
    reviews: 198,
    available: false,
    image: undefined,
  },
  {
    name: "Dr. Michael Brown",
    specialty: "Dermatology",
    rating: 4.7,
    reviews: 156,
    available: true,
    image: undefined,
  },
]

const TESTIMONIALS = [
  {
    quote:
      "I booked an appointment at 10pm and saw a doctor within 15 minutes. The video quality was excellent and I had a prescription by morning.",
    author: "Patient",
    role: "Maria L.",
    rating: 5,
  },
  {
    quote:
      "As a busy parent, being able to consult a pediatrician from home saves us hours. Our kids get quality care without the waiting room stress.",
    author: "Patient",
    role: "David K.",
    rating: 5,
  },
  {
    quote:
      "The platform handles everything — scheduling, video, prescriptions, records. It's the most streamlined telehealth experience I've used.",
    author: "Doctor",
    role: "Dr. Sarah W.",
    rating: 5,
  },
]

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-foreground/10 animate-pulse ${className}`} />
  )
}

export default function Page() {
  const router = useRouter()
  const { data: session, isPending, refetch } = authClient.useSession()
  const { data: dynamicDoctors, isLoading: isDoctorsLoading } = useDoctors()

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

      {/* Features Section */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-16 text-center">
            <Badge
              variant="outline"
              className="mb-4 rounded-full border-border text-muted-foreground"
            >
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Everything you need for
              <br />
              <span className="text-primary">connected care</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              From booking to follow-up, every step is designed to be fast,
              secure, and effortless.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30 hover:bg-card/80"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-muted/50" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-16 text-center">
            <Badge
              variant="outline"
              className="mb-4 rounded-full border-border text-muted-foreground"
            >
              Our doctors
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Expert doctors with
              <br />
              <span className="text-primary">real-world experience</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Board-certified professionals ready to provide quality care from
              anywhere.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isDoctorsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-border bg-card p-4 space-y-4 animate-pulse"
                  >
                    <div className="aspect-square bg-muted rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-4 w-1/4 bg-muted rounded" />
                      <div className="h-4 w-1/3 bg-muted rounded" />
                    </div>
                  </div>
                ))
              : (dynamicDoctors && dynamicDoctors.length > 0
                  ? dynamicDoctors.map((doc) => ({
                      name: doc.user.name ?? "Dr. Partner",
                      specialty: doc.specialty,
                      rating: doc.averageRating ?? 4.8,
                      reviews: doc.totalReviews ?? 0,
                      available: true,
                      image: doc.user.image,
                    }))
                  : DOCTORS
                ).map((doctor, index) => (
                  <div
                    key={doctor.name + index}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/30"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                      {doctor.image ? (
                        <Image
                          src={doctor.image}
                          alt={doctor.name}
                          unoptimized
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/60 select-none">
                          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                            {doctor.name.replace("Dr. ", "").charAt(0)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-card-foreground">
                            {doctor.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {doctor.specialty}
                          </div>
                        </div>
                        <Badge
                          className={`rounded-full text-xs ${
                            doctor.available
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {doctor.available ? "Available" : "Busy"}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <Star className="size-4 fill-warning text-warning" />
                        <span className="font-medium text-card-foreground">
                          {doctor.rating}
                        </span>
                        <span className="text-muted-foreground">
                          ({doctor.reviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 sm:py-32">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-16 text-center">
            <Badge
              variant="outline"
              className="mb-4 rounded-full border-border text-muted-foreground"
            >
              Testimonials
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Trusted by thousands of
              <br />
              <span className="text-primary">patients and doctors</span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6"
              >
                <div>
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="size-4 fill-warning text-warning"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {testimonial.role.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-card-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.author}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section
        id="security"
        className="relative overflow-hidden py-24 sm:py-32"
      >
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
                Every feature is designed to protect your sensitive medical
                data.
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

      {/* CTA Section */}
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
                    session
                      ? router.push(workspacePath)
                      : router.push("/sign-up")
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

      <Footer
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onOpenDashboard={() => router.push(workspacePath)}
      />
    </main>
  )
}
