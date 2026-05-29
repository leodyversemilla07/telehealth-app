import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  ArrowRight,
  CalendarClock,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { href: "#care-flow", label: "Care flow" },
      { href: "#roles", label: "Workspaces" },
      { href: "#security", label: "Security" },
    ],
  },
  {
    title: "Care teams",
    links: [
      { href: "/appointments/book", label: "Book appointment" },
      { href: "/doctors", label: "Find doctors" },
      { href: "/patient/records", label: "Medical records" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create account" },
      { href: "/settings", label: "Settings" },
    ],
  },
]

type HomepageFooterProps = {
  isAuthenticated: boolean
  onCreateAccount: () => void
  onOpenDashboard: () => void
}

export function HomepageFooter({
  isAuthenticated,
  onCreateAccount,
  onOpenDashboard,
}: HomepageFooterProps) {
  return (
    <footer className="border-t bg-[oklch(0.13_0.025_215)] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white text-[oklch(0.15_0.03_215)]">
                <HeartPulse />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold leading-none">Telehealth</span>
                <span className="text-xs text-white/58">
                  Care workspace for connected visits
                </span>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-white/66">
              Coordinate appointment booking, doctor availability, secure video
              visits, prescriptions, notifications, and records from one focused
              workspace.
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/10 text-white">
                <ShieldCheck data-icon="inline-start" />
                Session-aware
              </Badge>
              <Badge className="bg-white/10 text-white">
                <CalendarClock data-icon="inline-start" />
                Schedule-driven
              </Badge>
              <Badge className="bg-white/10 text-white">
                <Stethoscope data-icon="inline-start" />
                Doctor-ready
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h2 className="text-sm font-medium">{group.title}</h2>
                <nav aria-label={group.title} className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="text-sm text-white/58 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/6 p-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="font-medium">Ready for the next visit?</div>
              <div className="text-sm text-white/58">
                Continue into your workspace or create an account to begin.
              </div>
            </div>
            <Button
              onClick={isAuthenticated ? onOpenDashboard : onCreateAccount}
              className="bg-white text-[oklch(0.15_0.03_215)] hover:bg-white/90"
            >
              {isAuthenticated ? "Open dashboard" : "Create account"}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-col justify-between gap-3 text-xs text-white/48 sm:flex-row sm:items-center">
          <p>(c) 2026 Telehealth. All rights reserved.</p>
          <p>Built for appointments, consultations, and continuity of care.</p>
        </div>
      </div>
    </footer>
  )
}
