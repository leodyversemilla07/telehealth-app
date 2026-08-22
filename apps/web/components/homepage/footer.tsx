"use client"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Separator } from "@workspace/ui/components/separator"
import { AlertCircle, ArrowUp, Clock, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const FOOTER_NAV = [
  {
    title: "Care & Services",
    links: [
      { href: "/how-it-works", label: "How It Works" },
      { href: "/doctors", label: "Find a Doctor" },
      { href: "/specialties", label: "Medical Specialties" },
      { href: "/#symptoms", label: "AI Symptom Triage" },
      { href: "/patient/appointments/book", label: "Book Consultation" },
    ],
  },
  {
    title: "Portals & Clinicians",
    links: [
      { href: "/patient/dashboard", label: "Patient Portal" },
      { href: "/patient/appointments", label: "My Appointments" },
      { href: "/patient/records", label: "Medical Records" },
      { href: "/patient/prescriptions", label: "Prescriptions" },
      { href: "/doctor/register", label: "Join as a Doctor" },
      { href: "/doctor/dashboard", label: "Doctor Workspace" },
    ],
  },
  {
    title: "Support & Legal",
    links: [
      { href: "/about", label: "About Us & Mission" },
      { href: "/faq", label: "FAQ & Help Center" },
      { href: "/about", label: "Contact Support" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
]

export function Footer({
  isAuthenticated: _isAuthenticated,
  onCreateAccount: _onCreateAccount,
  onOpenDashboard: _onOpenDashboard,
}: {
  isAuthenticated?: boolean
  onCreateAccount?: () => void
  onOpenDashboard?: () => void
}) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="border-t border-border/80 bg-card text-foreground">
      <div className="mx-auto max-w-7xl px-5 pt-16 pb-12 sm:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Telehealth"
                width={36}
                height={36}
                className="size-9 rounded-xl object-cover"
              />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Telehealth
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Connecting patients with board-certified physicians across the
              Philippines through secure, browser-based video visits and
              compliant digital health records.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                <ShieldCheck className="size-4 text-primary" />
                <span>PRC-Verified Licensed Physicians</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-4 text-muted-foreground/70" />
                <span>24/7 Virtual Care & Scheduling</span>
              </div>
            </div>
          </div>

          {/* Columns 2, 3, 4: Navigation Categories */}
          {FOOTER_NAV.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Emergency Disclaimer Banner */}
        <div className="mt-12">
          <Alert
            variant="destructive"
            className="rounded-2xl border-destructive/30 bg-destructive/[0.04]"
          >
            <AlertCircle className="size-4 text-destructive" />
            <AlertTitle className="font-bold text-destructive text-xs">
              Medical Emergency Notice
            </AlertTitle>
            <AlertDescription className="text-xs text-foreground/80 leading-relaxed">
              Telehealth is designed for non-emergency medical consultations and
              general health inquiries. If you or a family member are
              experiencing a life-threatening medical emergency, severe chest
              pain, stroke symptoms, difficulty breathing, or trauma, please
              dial <strong>911</strong> or proceed immediately to the nearest
              hospital emergency room.
            </AlertDescription>
          </Alert>
        </div>

        {/* Bottom Bar */}
        <Separator className="my-8 bg-border/60" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Telehealth Philippines. All rights
            reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/faq" className="transition hover:text-foreground">
              Help Center
            </Link>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline"
            >
              <span>Back to top</span>
              <ArrowUp className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
