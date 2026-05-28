"use client"

import type { UserDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { HomepageFooter } from "@/components/homepage/footer"
import { HomepageHeader } from "@/components/homepage/header"
import { authClient } from "@/lib/auth-client"

const METRICS = [
  { label: "Avg. triage response", value: "04 min" },
  { label: "Clinics coordinated", value: "18" },
  { label: "Follow-ups completed", value: "92%" },
]

const CARE_FLOW = [
  {
    icon: CalendarClock,
    title: "Book the right slot",
    description:
      "Patients see live doctor availability, visit type, fee, and appointment windows before booking.",
  },
  {
    icon: Video,
    title: "Consult from anywhere",
    description:
      "Doctors and patients move from appointment details into a secured video room without manual handoffs.",
  },
  {
    icon: ClipboardList,
    title: "Close the loop",
    description:
      "Consultation notes, prescriptions, notifications, and follow-up records stay tied to the care journey.",
  },
]

const ROLE_PATHS = [
  {
    icon: UserRound,
    title: "For patients",
    description:
      "Find doctors, book appointments, join visits, and keep medical records in one place.",
  },
  {
    icon: Stethoscope,
    title: "For doctors",
    description:
      "Manage availability, approve visits, run consultations, and publish prescriptions.",
  },
  {
    icon: ShieldCheck,
    title: "For admins",
    description:
      "Review doctor onboarding, monitor appointments, and maintain operational controls.",
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
    <main className="min-h-svh bg-background text-foreground">
      <section
        id="top"
        className="relative isolate min-h-[92svh] overflow-hidden bg-[oklch(0.17_0.035_205)] text-white"
      >
        <div className="absolute inset-0 bg-[linear-gradient(110deg,oklch(0.1_0.018_220)_0%,oklch(0.16_0.055_205)_48%,oklch(0.23_0.045_145)_100%)]" />
        <div className="absolute inset-0 opacity-35 bg-[linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-background to-transparent" />

        <HomepageHeader
          isAuthenticated={Boolean(session)}
          onCreateAccount={() => router.push("/sign-up")}
          onSignIn={() => router.push("/sign-in")}
          onSignOut={handleSignOut}
        />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-20 pt-10 sm:px-8 lg:min-h-[calc(92svh-88px)] lg:grid-cols-[0.95fr_1.05fr] lg:pb-24 lg:pt-6">
          <div className="flex max-w-3xl flex-col gap-7">
            <Badge className="border-white/15 bg-white/10 text-white backdrop-blur">
              <Activity data-icon="inline-start" />
              Live visits, records, and care operations
            </Badge>

            <div className="flex flex-col gap-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] md:text-7xl">
                Care moves faster when every handoff is visible.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/76 md:text-lg">
                A telehealth workspace for booking, secure video visits, doctor
                schedules, prescriptions, and patient notifications.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {isPending ? (
                <>
                  <SkeletonBlock className="h-10 w-full sm:w-40" />
                  <SkeletonBlock className="h-10 w-full sm:w-36" />
                </>
              ) : session ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => router.push(workspacePath)}
                    className="bg-white text-[oklch(0.15_0.03_215)] hover:bg-white/90"
                  >
                    {dashboardLabel}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/settings")}
                    className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                  >
                    Profile settings
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => router.push("/sign-up")}
                    className="bg-white text-[oklch(0.15_0.03_215)] hover:bg-white/90"
                  >
                    Create account
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/sign-in")}
                    className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>

            <div className="grid max-w-2xl grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
              {METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-white/12 bg-white/8 p-4 backdrop-blur-md"
                >
                  <div className="text-2xl font-semibold">{metric.value}</div>
                  <div className="text-xs leading-5 text-white/62">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative min-h-130 overflow-hidden rounded-[2rem] border border-white/14 bg-[oklch(0.92_0.03_190/.12)] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            <div className="flex h-full min-h-122 flex-col gap-4 rounded-[1.5rem] border border-white/12 bg-[oklch(0.985_0.015_190/.94)] p-4 text-[oklch(0.18_0.03_215)] shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-[oklch(0.66_0.16_35)]" />
                  <span className="size-3 rounded-full bg-[oklch(0.78_0.13_95)]" />
                  <span className="size-3 rounded-full bg-[oklch(0.68_0.13_165)]" />
                </div>
                <div className="rounded-full bg-[oklch(0.9_0.02_190)] px-3 py-1 text-xs font-medium">
                  Appointment room active
                </div>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.3fr_.7fr]">
                <div className="flex min-h-[330px] flex-col justify-between overflow-hidden rounded-2xl bg-[oklch(0.16_0.035_215)] p-5 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-white/14">
                        <Stethoscope />
                      </div>
                      <div>
                        <div className="font-medium">Dr. Maria Santos</div>
                        <div className="text-xs text-white/58">
                          General Practice
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-[oklch(0.73_0.14_165)] text-[oklch(0.13_0.035_170)]">
                      Online
                    </Badge>
                  </div>

                  <div className="grid grid-cols-[1fr_.72fr] gap-4">
                    <div className="flex min-h-44 items-end rounded-2xl bg-[linear-gradient(145deg,oklch(0.31_0.06_210),oklch(0.2_0.045_230))] p-4">
                      <div className="flex flex-col gap-2">
                        <div className="h-3 w-32 rounded-full bg-white/26" />
                        <div className="h-3 w-24 rounded-full bg-white/16" />
                      </div>
                    </div>
                    <div className="flex min-h-44 items-end rounded-2xl bg-[linear-gradient(145deg,oklch(0.78_0.06_180),oklch(0.56_0.1_155))] p-4">
                      <div className="h-12 w-20 rounded-xl bg-white/28" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/8 p-3">
                    <div className="flex items-center gap-2 text-sm text-white/75">
                      <Video />
                      Secure consultation
                    </div>
                    <div className="flex gap-2">
                      <span className="size-8 rounded-full bg-white/14" />
                      <span className="size-8 rounded-full bg-white text-[oklch(0.16_0.035_215)]" />
                      <span className="size-8 rounded-full bg-[oklch(0.64_0.2_25)]" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">Vitals</div>
                        <div className="text-xs text-muted-foreground">
                          Updated now
                        </div>
                      </div>
                      <HeartPulse />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[oklch(0.96_0.02_180)] p-3">
                        <div className="text-xl font-semibold">98%</div>
                        <div className="text-xs text-muted-foreground">
                          SpO2
                        </div>
                      </div>
                      <div className="rounded-xl bg-[oklch(0.96_0.025_75)] p-3">
                        <div className="text-xl font-semibold">72</div>
                        <div className="text-xs text-muted-foreground">BPM</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="text-sm font-medium">Today</div>
                    <div className="mt-4 flex flex-col gap-3">
                      {["Triage", "Video visit", "Prescription"].map(
                        (item, index) => (
                          <div key={item} className="flex items-center gap-3">
                            <div className="flex size-7 items-center justify-center rounded-full bg-[oklch(0.18_0.03_215)] text-white">
                              {index + 1}
                            </div>
                            <div className="h-2 flex-1 rounded-full bg-[oklch(0.9_0.02_190)]" />
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-[oklch(0.18_0.03_215)] p-4 text-white shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquareText />
                      Patient notified
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/66">
                      Appointment confirmation and room link delivered.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="care-flow"
        className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-16 sm:px-8 lg:py-24"
      >
        <div className="grid gap-6 lg:grid-cols-[.78fr_1fr] lg:items-end">
          <div className="flex flex-col gap-4">
            <Badge variant="outline">Care flow</Badge>
            <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
              From first click to follow-up, each step is accounted for.
            </h2>
          </div>
          <p className="text-base leading-7 text-muted-foreground">
            The homepage reflects how the product is actually used: scheduling,
            consultation, documentation, notification, and ongoing record
            access.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CARE_FLOW.map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.title} className="rounded-lg">
                <CardHeader>
                  <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-secondary">
                    <Icon />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      <section id="roles" className="border-y bg-[oklch(0.97_0.015_190)]/70">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:py-24">
          <div className="flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-4">
              <Badge variant="outline">Workspaces</Badge>
              <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
                Built around the people moving care forward.
              </h2>
            </div>
            <div
              id="security"
              className="rounded-lg border bg-background p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                  <LockKeyhole />
                </div>
                <div>
                  <div className="font-medium">Session-aware by default</div>
                  <div className="text-sm text-muted-foreground">
                    Authenticated users land in the right dashboard path.
                  </div>
                </div>
              </div>
              <Separator className="my-5" />
              <div className="flex flex-wrap gap-2">
                {["Role routing", "Secure rooms", "Doctor controls"].map(
                  (item) => (
                    <Badge key={item} variant="secondary">
                      <CheckCircle2 data-icon="inline-start" />
                      {item}
                    </Badge>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {ROLE_PATHS.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.title} className="rounded-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Icon />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <HomepageFooter
        isAuthenticated={Boolean(session)}
        onCreateAccount={() => router.push("/sign-up")}
        onOpenDashboard={() => router.push(workspacePath)}
      />
    </main>
  )
}
