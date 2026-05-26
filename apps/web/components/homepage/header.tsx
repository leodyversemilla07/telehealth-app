import { Button } from "@workspace/ui/components/button"
import { Activity, HeartPulse, LogOut } from "lucide-react"

const NAV_ITEMS = [
  { href: "#care-flow", label: "Care flow" },
  { href: "#roles", label: "Roles" },
  { href: "#security", label: "Security" },
]

type HomepageHeaderProps = {
  isAuthenticated: boolean
  onCreateAccount: () => void
  onSignIn: () => void
  onSignOut: () => void
}

function BrandMark() {
  return (
    <a href="#top" className="flex items-center gap-2">
      <div className="flex size-9 items-center justify-center rounded-lg bg-white text-[oklch(0.15_0.03_215)]">
        <HeartPulse />
      </div>
      <div className="flex flex-col">
        <span className="font-semibold leading-none">Telehealth</span>
        <span className="text-xs text-white/62">Care workspace</span>
      </div>
    </a>
  )
}

export function HomepageHeader({
  isAuthenticated,
  onCreateAccount,
  onSignIn,
  onSignOut,
}: HomepageHeaderProps) {
  return (
    <header className="relative mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-5 py-5 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
      <BrandMark />
      <nav
        aria-label="Homepage"
        className="order-3 col-span-2 flex items-center gap-2 overflow-x-auto rounded-lg border border-white/10 bg-white/6 p-1 backdrop-blur-md md:order-none md:col-span-1 md:w-fit"
      >
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm text-white/72 transition hover:bg-white/8 hover:text-white"
          >
            {item.label}
          </a>
        ))}
        <span className="hidden h-5 w-px bg-white/14 md:block" />
        <a
          href="#security"
          className="hidden h-8 shrink-0 items-center gap-1 rounded-md px-3 text-sm text-white/72 transition hover:bg-white/8 hover:text-white md:inline-flex"
        >
          <Activity />
          Live ops
        </a>
      </nav>

      <div className="flex items-center justify-end gap-2">
        {isAuthenticated ? (
          <Button
            variant="outline"
            onClick={onSignOut}
            className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white"
          >
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onSignIn}
              className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Sign in
            </Button>
            <Button
              variant="outline"
              onClick={onCreateAccount}
              className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white"
            >
              Create account
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
