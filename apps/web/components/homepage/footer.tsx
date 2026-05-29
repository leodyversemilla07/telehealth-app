import Image from "next/image"

const FOOTER_ROWS = [
  {
    label: "Care",
    links: [
      { href: "#features", label: "Features" },
      { href: "#doctors", label: "Doctors" },
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
    label: "Social",
    links: [
      { href: "#", label: "Twitter" },
      { href: "#", label: "LinkedIn" },
      { href: "#", label: "YouTube" },
    ],
  },
]

type HomepageFooterProps = {
  isAuthenticated: boolean
  onCreateAccount: () => void
  onOpenDashboard: () => void
}

export function Footer({
  isAuthenticated: _isAuthenticated,
  onCreateAccount: _onCreateAccount,
  onOpenDashboard: _onOpenDashboard,
}: HomepageFooterProps) {
  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-[oklch(0.1_0.02_220)]">
      {/* Decorative background pattern */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[oklch(0.2_0.06_195/0.15)] blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-40 h-60 w-60 rounded-full bg-[oklch(0.25_0.08_195/0.1)] blur-2xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-16 sm:px-8">
        {/* Logo + Tagline */}
        <div className="flex flex-col gap-5">
          <a href="#top" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Telehealth"
              width={36}
              height={36}
              className="size-9 rounded-xl object-cover"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              TELEHEALTH
            </span>
          </a>
          <p className="max-w-lg text-base leading-relaxed text-white/50">
            Nine out of ten patients recommend Telehealth over competing
            platforms. Come inside, see for yourself, and experience healthcare
            the way it should be.
          </p>
        </div>

        {/* Footer Rows */}
        <div className="flex flex-col gap-5">
          {FOOTER_ROWS.map((row) => (
            <div key={row.label} className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
              <span className="w-24 shrink-0 text-sm font-bold text-white">
                {row.label}
              </span>
              <nav aria-label={row.label} className="flex flex-wrap gap-x-6 gap-y-2">
                {row.links.map((link) => (
                  <a
                    key={link.href + link.label}
                    href={link.href}
                    className="text-sm text-white/40 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-white/8 pt-8">
          <p className="font-mono text-xs leading-relaxed text-white/30">
            &copy; Telehealth 2026. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
