"use client"

import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Star,
  Video,
  Activity,
  LockKeyhole,
  MessageSquareText,
  FileText,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
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
  },
  {
    name: "Dr. James Chen",
    specialty: "Internal Medicine",
    rating: 4.8,
    reviews: 287,
    available: true,
  },
  {
    name: "Dr. Sarah Williams",
    specialty: "Pediatrics",
    rating: 4.9,
    reviews: 198,
    available: false,
  },
  {
    name: "Dr. Michael Brown",
    specialty: "Dermatology",
    rating: 4.7,
    reviews: 156,
    available: true,
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
    <main className="min-h-svh bg-[oklch(0.12_0.025_220)] text-white">
      {/* Hero Section */}
      <section id="top" className="relative isolate overflow-hidden">


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
                className="rounded-full border-[oklch(0.65_0.15_195/0.3)] bg-[oklch(0.65_0.15_195/0.1)] px-3 py-1 text-xs text-[oklch(0.8_0.1_195)]"
              >
                <CheckCircle2 className="mr-1 size-3" />
                {badge}
              </Badge>
            ))}
          </div>

          <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">
              Care moves faster
            </span>
            <br />
            <span className="text-[oklch(0.75_0.15_195)]">
              when every handoff is visible.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
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
                className="rounded-full bg-white px-8 text-[oklch(0.15_0.03_215)] hover:bg-white/90"
              >
                {dashboardLabel}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => router.push("/sign-up")}
                  className="rounded-full bg-white px-8 text-[oklch(0.15_0.03_215)] hover:bg-white/90"
                >
                  Get started free
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => router.push("/sign-in")}
                  className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
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
              className="mb-4 rounded-full border-white/15 text-white/60"
            >
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Everything you need for
              <br />
              <span className="text-[oklch(0.75_0.15_195)]">
                connected care
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
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
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-6 transition hover:border-white/15 hover:bg-white/4"
                >
                  <div
                    className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[oklch(0.65_0.15_195/0.15)]"
                  >
                    <Icon className="size-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section
        id="doctors"
        className="relative overflow-hidden py-24 sm:py-32"
      >
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-16 text-center">
            <Badge
              variant="outline"
              className="mb-4 rounded-full border-white/15 text-white/60"
            >
              Our doctors
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Expert doctors with
              <br />
              <span className="text-[oklch(0.75_0.15_195)]">
                real-world experience
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              Board-certified professionals ready to provide quality care from
              anywhere.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOCTORS.map((doctor) => (
              <div
                key={doctor.name}
                className="group overflow-hidden rounded-2xl border border-white/8 bg-white/2 transition hover:border-white/15 hover:bg-white/4"
              >
                <div className="aspect-square bg-[oklch(0.2_0.04_215)]" />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{doctor.name}</div>
                      <div className="text-sm text-white/50">
                        {doctor.specialty}
                      </div>
                    </div>
                    <Badge
                      className={`rounded-full text-xs ${
                        doctor.available
                          ? "bg-[oklch(0.7_0.15_150)] text-[oklch(0.2_0.05_150)]"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {doctor.available ? "Available" : "Busy"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Star className="size-4 fill-[oklch(0.8_0.15_85)] text-[oklch(0.8_0.15_85)]" />
                    <span className="font-medium">{doctor.rating}</span>
                    <span className="text-white/40">
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
              className="mb-4 rounded-full border-white/15 text-white/60"
            >
              Testimonials
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Trusted by thousands of
              <br />
              <span className="text-[oklch(0.75_0.15_195)]">
                patients and doctors
              </span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-white/8 bg-white/2 p-6"
              >
                <div>
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="size-4 fill-[oklch(0.8_0.15_85)] text-[oklch(0.8_0.15_85)]"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-white/70">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[oklch(0.65_0.15_195/0.15)] text-sm font-semibold text-[oklch(0.75_0.15_195)]">
                    {testimonial.role.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-white/40">
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
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge
                variant="outline"
                className="mb-4 rounded-full border-white/15 text-white/60"
              >
                Security & Compliance
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Your privacy is
                <br />
                <span className="text-[oklch(0.75_0.15_195)]">
                  non-negotiable
                </span>
              </h2>
              <p className="mt-4 text-white/50">
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
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.65_0.15_195/0.15)]">
                        <Icon className="size-5 text-[oklch(0.75_0.15_195)]" />
                      </div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-white/50">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-[oklch(0.15_0.03_215/0.3)] p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[oklch(0.7_0.15_150/0.15)]">
                    <CheckCircle2 className="size-5 text-[oklch(0.7_0.15_150)]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Session secured</div>
                    <div className="text-xs text-white/40">
                      2FA enabled · Last login 2 min ago
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[oklch(0.65_0.15_195/0.15)]">
                    <LockKeyhole className="size-5 text-[oklch(0.75_0.15_195)]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Data encrypted</div>
                    <div className="text-xs text-white/40">
                      AES-256 · All records protected
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[oklch(0.8_0.15_85/0.15)]">
                    <ShieldCheck className="size-5 text-[oklch(0.8_0.15_85)]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Consent logged</div>
                    <div className="text-xs text-white/40">
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
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.15_0.03_215/0.5)] p-8 text-center backdrop-blur-sm sm:p-12">
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Ready for better care?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/60">
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
                  className="rounded-full bg-white px-8 text-[oklch(0.15_0.03_215)] hover:bg-white/90"
                >
                  {session ? dashboardLabel : "Get started free"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => router.push("/sign-in")}
                  className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
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
