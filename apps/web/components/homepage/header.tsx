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
import { LayoutDashboard, Menu } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ThemeToggle } from "../theme-toggle"

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#doctors", label: "Doctors" },
  { href: "#faq", label: "FAQ" },
  { href: "#security", label: "Security" },
]

// Scroll range over which the header morphs from a transparent overlay
// into the floating glass pill (px of window.scrollY).
const FADE_START = 8
const FADE_RANGE = 64

// Max values the interpolated styles reach when fully "scrolled".
const MAX_TOP = 12 // px
const MAX_PADDING_Y = 4 // px shrink (16 -> 12)
const MAX_RADIUS = 16 // px (rounded-2xl)
const MAX_BG_ALPHA = 0.95
const MAX_BORDER_ALPHA = 0.6
const MAX_BLUR = 20 // px
const MAX_SHADOW = 0.08 // alpha of the soft shadow

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
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
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
  // 0 = transparent overlay at the top, 1 = fully scrolled glass pill.
  const [progress, setProgress] = useState(0)
  const easedRef = useRef(0)

  useEffect(() => {
    let target = 0
    let raf = 0

    const tick = () => {
      const next = easedRef.current + (target - easedRef.current) * 0.14
      easedRef.current = next
      setProgress(next)
      if (Math.abs(target - next) > 0.0005) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }

    const onScroll = () => {
      const p = Math.min(
        Math.max((window.scrollY - FADE_START) / FADE_RANGE, 0),
        1,
      )
      target = p
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (prefersReducedMotion) {
      // Snap instead of easing for users who opt out of motion.
      const onScrollReduced = () => {
        target = Math.min(
          Math.max((window.scrollY - FADE_START) / FADE_RANGE, 0),
          1,
        )
        easedRef.current = target
        setProgress(target)
      }
      onScrollReduced()
      window.addEventListener("scroll", onScrollReduced, { passive: true })
      return () => window.removeEventListener("scroll", onScrollReduced)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const e = progress
  const headerStyle: React.CSSProperties = {
    top: `${e * MAX_TOP}px`,
    paddingTop: `${16 - e * MAX_PADDING_Y}px`,
    paddingBottom: `${16 - e * MAX_PADDING_Y}px`,
    borderRadius: `${e * MAX_RADIUS}px`,
    backgroundColor: `color-mix(in oklab, var(--background) ${e * MAX_BG_ALPHA * 100}%, transparent)`,
    borderColor: `color-mix(in oklab, var(--border) ${e * MAX_BORDER_ALPHA * 100}%, transparent)`,
    boxShadow: `0 ${e * 10}px ${e * 28}px -${e * 10}px rgb(0 0 0 / ${e * MAX_SHADOW})`,
    backdropFilter: `blur(${e * MAX_BLUR}px)`,
    WebkitBackdropFilter: `blur(${e * MAX_BLUR}px)`,
  }

  // The desktop nav pill fades from a faint chip into a solid glass chip.
  const navStyle: React.CSSProperties = {
    backgroundColor: `color-mix(in oklab, var(--background) ${50 + 40 * e}%, transparent)`,
    borderColor: `color-mix(in oklab, var(--border) 60%, transparent)`,
    backdropFilter: `blur(12px)`,
    WebkitBackdropFilter: `blur(12px)`,
  }

  function handleNavClick(href: string) {
    setMobileOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-7xl items-center justify-between border px-5 sm:px-8"
      style={headerStyle}
    >
      <BrandMark />

      {/* Desktop nav */}
      <NavigationMenu
        aria-label="Homepage"
        className="hidden rounded-full border px-1.5 py-1 md:flex"
        style={navStyle}
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
        <ThemeToggle
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
        />

        {/* Mobile menu trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-9 md:hidden text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
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
            className="h-10 rounded-full border-border/80 bg-background/50 text-foreground hover:bg-muted dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Dashboard
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onSignIn}
              className="hidden h-10 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/70 dark:hover:bg-white/8 dark:hover:text-white sm:inline-flex"
            >
              Sign in
            </Button>
            <Button
              onClick={onCreateAccount}
              className="h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-background dark:hover:bg-white/90"
            >
              Get started
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
