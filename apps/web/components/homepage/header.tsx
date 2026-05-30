import { Button } from "@workspace/ui/components/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@workspace/ui/components/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { LayoutDashboard, Menu } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { ThemeToggle } from "../theme-toggle"

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
        suppressHydrationWarning
      />
      <span className="text-lg font-semibold tracking-tight text-foreground">
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
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleNavClick(href: string) {
    setMobileOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <header className="relative z-50 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
      <BrandMark />

      {/* Desktop nav */}
      <NavigationMenu
        aria-label="Homepage"
        className="hidden rounded-full border border-border/80 bg-background/50 px-1.5 py-1 backdrop-blur-md dark:border-white/10 dark:bg-white/5 md:flex"
      >
        <NavigationMenuList className="gap-0">
          {NAV_ITEMS.map((item) => (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink
                href={item.href}
                className="inline-flex h-8 shrink-0 items-center rounded-full px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
              >
                {item.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-2">
        <ThemeToggle variant="ghost" size="icon" className="rounded-full" />

        {/* Mobile menu trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Open navigation menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 border-border/80 bg-background text-foreground dark:bg-[oklch(0.12_0.025_220)] dark:border-white/10 dark:text-white"
          >
            <SheetHeader>
              <SheetTitle className="text-foreground dark:text-white">
                Navigation
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavClick(item.href)}
                  className="flex items-center rounded-lg px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white text-left"
                >
                  {item.label}
                </button>
              ))}
              <div className="my-3 border-t border-border/80 dark:border-white/10" />
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    onDashboard()
                  }}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white text-left"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      onSignIn()
                    }}
                    className="flex items-center rounded-lg px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white text-left"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      onCreateAccount()
                    }}
                    className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-foreground bg-muted transition hover:bg-muted/80 dark:text-white dark:bg-white/10 dark:hover:bg-white/15 text-left mt-1"
                  >
                    Get started
                  </button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {isAuthenticated ? (
          <Button
            variant="outline"
            onClick={onDashboard}
            className="rounded-full border-border/80 bg-background/50 text-foreground hover:bg-muted dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Dashboard
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onSignIn}
              className="hidden rounded-full text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/70 dark:hover:bg-white/8 dark:hover:text-white sm:inline-flex"
            >
              Sign in
            </Button>
            <Button
              onClick={onCreateAccount}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-background dark:hover:bg-white/90"
            >
              Get started
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
