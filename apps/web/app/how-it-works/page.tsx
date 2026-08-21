"use client"

import type { UserDto } from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Info,
  Monitor,
  Smartphone,
  UserCheck,
  Video,
  Wifi,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Footer } from "@/components/homepage/footer"
import { Header } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"

const DETAILED_STEPS = [
  {
    step: "01",
    percent: 33,
    title: "Find Your Specialist & Choose a Time",
    subtitle: "Real-time calendar booking in under 60 seconds",
    description:
      "Browse our directory of board-certified physicians across primary care, cardiology, dermatology, pediatrics, and more. Filter by symptoms or availability, review consultation fees upfront, and select a time slot in Philippine Standard Time (PHT).",
    icon: UserCheck,
    points: [
      "View verified PRC license numbers and specialties",
      "Transparent consultation rates with zero hidden charges",
      "Instant email and calendar confirmation with room link",
    ],
  },
  {
    step: "02",
    percent: 66,
    title: "Join the Secure Virtual Consultation Room",
    subtitle: "Browser-based encrypted HD video visits",
    description:
      "When it's time for your appointment, simply click 'Join Consultation' from your dashboard or email. No app downloads or browser extensions are required. Our video room is end-to-end encrypted and works seamlessly across desktops, laptops, tablets, and smartphones.",
    icon: Video,
    points: [
      "High-definition video and noise-filtered audio",
      "Interactive text chat and file/photo sharing for lab results",
      "Strict data isolation and privacy protection",
    ],
  },
  {
    step: "03",
    percent: 100,
    title: "Receive Diagnostic Care & Digital Prescriptions",
    subtitle: "Instant medical records and legally valid e-prescriptions",
    description:
      "Immediately following your visit, your physician records their clinical notes, diagnostic impressions, and treatment plan. Any prescribed medications are generated as official digital e-prescriptions with the doctor's electronic signature and license credentials.",
    icon: FileText,
    points: [
      "Official digital prescriptions ready to present at licensed pharmacies",
      "Downloadable clinical summary and follow-up instructions",
      "Permanent, secure access in your personal Medical Records portal",
    ],
  },
]

const REQUIREMENTS = [
  {
    icon: Monitor,
    title: "Modern Web Browser",
    desc: "Chrome, Safari, Edge, or Firefox updated to the latest version.",
  },
  {
    icon: Smartphone,
    title: "Any Modern Device",
    desc: "Works on desktop computers, laptops, iPads, tablets, iOS, and Android.",
  },
  {
    icon: Video,
    title: "Camera & Microphone",
    desc: "Built-in or external webcam and microphone with browser permissions enabled.",
  },
  {
    icon: Wifi,
    title: "Reliable Internet",
    desc: "Stable Wi-Fi or 4G/5G mobile connection (minimum 2 Mbps recommended).",
  },
]

export default function HowItWorksPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const user = session?.user as unknown as UserDto | undefined
  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onSignIn={() => router.push("/sign-in")}
        onSignOut={async () => {
          await authClient.signOut()
          router.refresh()
        }}
        onDashboard={() => router.push(workspacePath)}
      />

      <main className="pt-10 pb-16 sm:pt-14 sm:pb-20 md:pt-16">
        {/* Page Header */}
        <section className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Badge className="rounded-full border-primary/25 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
            How It Works
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Virtual healthcare,{" "}
            <span className="text-primary">step by step</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Everything you need to know about booking, consulting with licensed
            doctors online, and receiving your digital prescriptions.
          </p>
        </section>

        {/* 3 Step Detailed Walkthrough */}
        <section className="mx-auto mt-20 max-w-5xl px-5 sm:px-8">
          <div className="space-y-12">
            {DETAILED_STEPS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                        Step {item.step} of 03
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.subtitle}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">
                      {item.percent}%
                    </span>
                  </div>
                  <Progress value={item.percent} className="h-1 rounded-full" />

                  <div className="flex flex-col sm:flex-row sm:items-start gap-6 pt-2">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-7" />
                    </div>

                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-card-foreground">
                        {item.title}
                      </h2>
                      <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-6 border-t border-border/60 pt-5">
                        <ul className="grid gap-2.5 sm:grid-cols-1">
                          {item.points.map((pt) => (
                            <li
                              key={pt}
                              className="flex items-center gap-2.5 text-sm text-foreground"
                            >
                              <CheckCircle2 className="size-4 shrink-0 text-success" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Technical Requirements Section */}
        <section className="mx-auto mt-24 max-w-5xl px-5 sm:px-8">
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-8 sm:p-12">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge className="rounded-full border-border/80 bg-background px-3 py-0.5 text-xs font-medium text-muted-foreground">
                Compatibility
              </Badge>
              <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-foreground">
                What do you need for a consultation?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Our platform requires no external plugins or software installs.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {REQUIREMENTS.map((req) => {
                const Icon = req.icon
                return (
                  <div
                    key={req.title}
                    className="rounded-xl border border-border/80 bg-card p-5"
                  >
                    <Icon className="size-5 text-primary mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      {req.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {req.desc}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-8">
              <Alert className="rounded-xl border-border/80 bg-background">
                <Info className="size-4 text-primary" />
                <AlertTitle className="text-xs font-bold text-foreground">
                  Browser-Native Zero Installation
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                  You do not need to download an application from the App Store
                  or Google Play. All consultation rooms launch natively and
                  securely in your web browser.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </section>

        {/* CTA Box */}
        <section className="mx-auto mt-20 max-w-5xl px-5 sm:px-8">
          <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-12 text-center shadow-sm">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Ready to schedule your appointment?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              Speak with a licensed medical doctor in minutes from the comfort
              of your home.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() =>
                  router.push(
                    session
                      ? "/patient/appointments/book"
                      : "/patient/appointments/book",
                  )
                }
                className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Book a Consultation
                <ArrowRight className="ml-2 size-4.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/doctors")}
                className="h-12 rounded-xl border-border/80 px-7 text-base font-medium hover:bg-muted"
              >
                Explore Doctors
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onOpenDashboard={() => router.push(workspacePath)}
      />
    </div>
  )
}
