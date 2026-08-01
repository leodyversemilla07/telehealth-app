"use client"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowUp, Clock3, Mail, Phone } from "lucide-react"
import Image from "next/image"

const FOOTER_COLUMNS = [
  {
    label: "Care",
    links: [
      { href: "#features", label: "Features" },
      { href: "#doctors", label: "Our doctors" },
      { href: "#security", label: "Security" },
      { href: "/appointments/book", label: "Book appointment" },
    ],
  },
  {
    label: "Patients",
    links: [
      { href: "/patient/appointments", label: "My appointments" },
      { href: "/patient/records", label: "Medical records" },
      { href: "/patient/prescriptions", label: "Prescriptions" },
      { href: "/patient/messages", label: "Messages" },
    ],
  },
  {
    label: "Doctors",
    links: [
      { href: "/doctor/register", label: "Join as doctor" },
      { href: "/doctor/schedule", label: "Manage schedule" },
      { href: "/doctor/consultations", label: "Consultations" },
      { href: "/doctor/dashboard", label: "Dashboard" },
    ],
  },
  {
    label: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Preferences" },
      { href: "/compliance", label: "Compliance" },
    ],
  },
]

// Official brand SVG paths (Simple Icons, CC0). Brand colors applied on hover.
const SOCIALS = [
  {
    label: "X",
    href: "https://x.com",
    path: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
    hover: "group-hover:text-[#000000] dark:group-hover:text-white",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    hover: "group-hover:text-[#0A66C2]",
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    hover: "group-hover:text-[#FF0000]",
  },
]

type HomepageFooterProps = {
  isAuthenticated: boolean
  onCreateAccount: () => void
  onOpenDashboard: () => void
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

export function Footer({
  isAuthenticated: _isAuthenticated,
  onCreateAccount: _onCreateAccount,
  onOpenDashboard: _onOpenDashboard,
}: HomepageFooterProps) {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-muted/50 dark:border-white/8 dark:bg-[oklch(0.1_0.02_220)]">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/5 dark:bg-[oklch(0.2_0.06_195/0.15)] blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-primary/[0.03] dark:bg-[oklch(0.25_0.08_195/0.08)] blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8">
        {/* Top row: Brand + Social + Back to top */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <a href="#top" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Telehealth"
                width={36}
                height={36}
                className="size-9 rounded-xl object-cover"
                suppressHydrationWarning
              />
              <span className="font-display text-2xl font-semibold tracking-tight text-foreground dark:text-white">
                Telehealth
              </span>
            </a>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground dark:text-white/50">
              Virtual healthcare that puts your time first. Secure, fast, and
              always private.
            </p>
            {/* Social icons — official brand marks (Simple Icons), brand color on hover */}
            <div className="mt-4 flex items-center gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex size-9 items-center justify-center rounded-lg border border-border/60 bg-background/50 transition hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                  aria-label={social.label}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    role="img"
                    aria-label={social.label}
                    className={cn(
                      "size-4 fill-current text-muted-foreground transition-colors duration-300 dark:text-white/40",
                      social.hover,
                    )}
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={scrollToTop}
            className="hidden size-10 rounded-full border border-border/60 bg-background/50 text-muted-foreground hover:bg-muted hover:text-foreground sm:flex dark:border-white/10 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Back to top"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>

        {/* Divider */}
        <Separator className="my-10 bg-border/60 dark:bg-white/8" />

        {/* Contact strip — the article's "don't forget your contact details" */}
        <div className="mb-12 grid gap-4 rounded-2xl border border-border/60 bg-background/50 p-5 sm:grid-cols-3 dark:border-white/10 dark:bg-white/[0.03]">
          <a
            href="mailto:hello@tele-health.app"
            className="group flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-muted/70 dark:hover:bg-white/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
              <Mail className="size-4.5" />
            </span>
            <span>
              <span className="block text-xs text-muted-foreground">
                Email us
              </span>
              <span className="block text-sm font-medium text-foreground">
                hello@tele-health.app
              </span>
            </span>
          </a>
          <a
            href="tel:+63288888888"
            className="group flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-muted/70 dark:hover:bg-white/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning transition group-hover:scale-105">
              <Phone className="size-4.5" />
            </span>
            <span>
              <span className="block text-xs text-muted-foreground">
                Call us
              </span>
              <span className="block text-sm font-medium text-foreground">
                +63 2 8888 8888
              </span>
            </span>
          </a>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
              <Clock3 className="size-4.5" />
            </span>
            <span>
              <span className="block text-xs text-muted-foreground">
                Consultations
              </span>
              <span className="block text-sm font-medium text-foreground">
                Online 24/7 — no waiting room
              </span>
            </span>
          </div>
        </div>

        {/* Column grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.label}>
              <h3 className="text-sm font-semibold text-foreground dark:text-white">
                {column.label}
              </h3>
              <nav
                aria-label={column.label}
                className="mt-3 flex flex-col gap-2"
              >
                {column.links.map((link) => (
                  <a
                    key={link.href + link.label}
                    href={link.href}
                    className="text-sm text-muted-foreground/80 transition hover:text-foreground dark:text-white/40 dark:hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* App store badges */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/50 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white">
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              role="img"
              aria-label="Apple icon"
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Download on the App Store
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/50 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white">
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              role="img"
              aria-label="Google Play icon"
            >
              <path d="M22.018 10.308l-1.974-.374a5.21 5.21 0 00.066-.434l1.958-.365a.755.755 0 00.496-.922.755.755 0 00-.922-.495l-2.03.378a5.16 5.16 0 00-.941-1.611l1.443-1.443a.755.755 0 000-1.066.755.755 0 00-1.066 0l-1.443 1.443a5.145 5.145 0 00-1.611-.94l.378-2.03a.761.761 0 00-.496-.923.755.755 0 00-.922.495l-.365 1.958a5.2 5.2 0 00-.434.066l-.374-1.974a.755.755 0 00-.922-.496.755.755 0 00-.496.922l.374 1.974a5.21 5.21 0 00-.434.066l-.365-1.958a.755.755 0 00-.922-.495.755.755 0 00-.496.923l.378 2.03a5.177 5.177 0 00-1.611.94L3.846 6.23a.755.755 0 00-1.066 0 .755.755 0 000 1.066l1.443 1.443a5.16 5.16 0 00-.941 1.611l-2.03-.378a.755.755 0 00-.922.495.755.755 0 00.496.922l1.958.365a5.21 5.21 0 00-.066.434l-1.974.374a.755.755 0 00-.496.922.755.755 0 00.922.495l1.974-.374c.02.146.042.29.066.434l-1.958.365a.755.755 0 00-.496.922.755.755 0 00.922.495l2.03-.378a5.177 5.177 0 00.94 1.611l-1.443 1.443a.755.755 0 000 1.066.755.755 0 001.066 0l1.443-1.443a5.16 5.16 0 001.611.941l-.378 2.03a.755.755 0 00.496.923.755.755 0 00.922-.495l.365-1.958c.144.024.29.046.434.066l-.374 1.974a.755.755 0 00.496.922.755.755 0 00.922-.495l.374-1.974a5.21 5.21 0 00.434-.066l.365 1.958a.755.755 0 00.922.495.755.755 0 00.496-.923l-.378-2.03a5.177 5.177 0 001.611-.94l1.443 1.443a.755.755 0 001.066 0 .755.755 0 000-1.066l-1.443-1.443a5.16 5.16 0 00.941-1.611l2.03.378a.755.755 0 00.922-.495.755.755 0 00-.496-.922zM12 15a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
            Get it on Google Play
          </span>
        </div>

        {/* Bottom bar */}
        <Separator className="my-8 bg-border/60 dark:bg-white/8" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground/50 dark:text-white/30">
            &copy; {new Date().getFullYear()} Telehealth. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/privacy"
              className="text-xs text-muted-foreground/50 transition hover:text-foreground dark:text-white/30 dark:hover:text-white"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-xs text-muted-foreground/50 transition hover:text-foreground dark:text-white/30 dark:hover:text-white"
            >
              Terms
            </a>
            <a
              href="/cookies"
              className="text-xs text-muted-foreground/50 transition hover:text-foreground dark:text-white/30 dark:hover:text-white"
            >
              Cookies
            </a>
          </div>
        </div>

        {/* Mobile back to top */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToTop}
            className="rounded-full text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowUp className="mr-1.5 size-3" />
            Back to top
          </Button>
        </div>
      </div>
    </footer>
  )
}
