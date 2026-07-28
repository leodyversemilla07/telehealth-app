"use client"

import { Button } from "@workspace/ui/components/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@workspace/ui/components/navigation-menu"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"
import { LayoutDashboard, Menu } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function handleNavClick(href: string) {
    setMobileOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 transition-all duration-300",
        scrolled
          ? "top-3 rounded-2xl border border-border/50 bg-background/80 px-5 py-3 backdrop-blur-xl sm:px-6 shadow-lg shadow-black/5"
          : "bg-transparent",
      )}
    >
      <BrandMark />

      {/* Desktop nav */}
      <NavigationMenu
        aria-label="Homepage"
        className={cn(
          "hidden rounded-full border px-1.5 py-1 md:flex transition-all duration-300",
          scrolled
            ? "border-border/60 bg-background/80 backdrop-blur-md"
            : "border-border/80 bg-background/50 backdrop-blur-md dark:border-white/10 dark:bg-white/5",
        )}
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
            side="right"
            className="w-72 border-border/80 bg-background/95 backdrop-blur-xl text-foreground dark:bg-[oklch(0.12_0.025_220)/0.95] dark:border-white/10 dark:text-white"
          >
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full">
              <nav className="mt-4 flex flex-col gap-0.5">
                {NAV_ITEMS.map((item) => (
                  <Button
                    variant="ghost"
                    key={item.href}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    className="h-auto justify-start rounded-lg px-4 py-2.5 text-left text-sm text-muted-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <Separator className="bg-border/80 dark:bg-white/10" />
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      onDashboard()
                    }}
                    className="h-auto justify-start rounded-lg px-4 py-2.5 text-left text-sm text-muted-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <LayoutDashboard className="size-4 mr-2" />
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setMobileOpen(false)
                        onSignIn()
                      }}
                      className="h-auto justify-start rounded-lg px-4 py-2.5 text-left text-sm text-muted-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      Sign in
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false)
                        onCreateAccount()
                      }}
                      className="h-auto justify-start rounded-lg bg-primary px-4 py-2.5 text-left text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </div>
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
