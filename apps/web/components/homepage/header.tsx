import { Button } from "@workspace/ui/components/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@workspace/ui/components/navigation-menu"
import Image from "next/image"
import { LayoutDashboard } from "lucide-react"

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#doctors", label: "Doctors" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#security", label: "Security" },
]

type HomepageHeaderProps = {
  isAuthenticated: boolean
  onCreateAccount: () => void
  onSignIn: () => void
  onSignOut: () => void
  onDashboard: () => void
}

function BrandMark() {
  return (
    <a href="#top" className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Telehealth"
        width={36}
        height={36}
        className="size-9 rounded-xl object-cover"
      />
      <span className="text-lg font-semibold tracking-tight text-white">
        Telehealth
      </span>
    </a>
  )
}

export function Header({
  isAuthenticated,
  onCreateAccount,
  onSignIn,
  onSignOut: _onSignOut,
  onDashboard,
}: HomepageHeaderProps) {
  return (
    <header className="relative z-50 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
      <BrandMark />

      <NavigationMenu
        aria-label="Homepage"
        className="hidden rounded-full border border-white/10 bg-white/5 px-1.5 py-1 backdrop-blur-md md:flex"
      >
        <NavigationMenuList className="gap-0">
          {NAV_ITEMS.map((item) => (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink
                href={item.href}
                className="inline-flex h-8 shrink-0 items-center rounded-full px-4 text-sm text-white/60 transition hover:bg-white/8 hover:text-white"
              >
                {item.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <Button
            variant="outline"
            onClick={onDashboard}
            className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onSignIn}
              className="hidden rounded-full text-white/70 hover:bg-white/8 hover:text-white sm:inline-flex"
            >
              Sign in
            </Button>
            <Button
              onClick={onCreateAccount}
              className="rounded-full bg-white text-[oklch(0.15_0.03_215)] hover:bg-white/90"
            >
              Get started
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
