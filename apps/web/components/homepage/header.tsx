"use client"

import type { UserDto } from "@workspace/shared"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import {
  Calendar,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { ThemeToggle } from "../theme-toggle"

const NAV_ITEMS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/doctors", label: "Doctors" },
  { href: "/specialties", label: "Specialties" },
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "FAQ" },
]

type HomepageHeaderProps = {
  isAuthenticated?: boolean
  onCreateAccount?: () => void
  onSignIn?: () => void
  onSignOut?: () => void
  onDashboard?: () => void
}

export function Header({
  isAuthenticated: propIsAuthenticated,
  onCreateAccount,
  onSignIn,
  onSignOut,
  onDashboard,
}: HomepageHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: session, refetch } = authClient.useSession()
  const user = session?.user as unknown as UserDto | undefined
  const isAuth = Boolean(session) || Boolean(propIsAuthenticated)

  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard"

  const appointmentsPath =
    user?.role === "DOCTOR" ? "/doctor/consultations" : "/patient/appointments"

  const recordsPath =
    user?.role === "DOCTOR" ? "/doctor/records" : "/patient/records"

  const settingsPath =
    user?.role === "ADMIN"
      ? "/admin/settings"
      : user?.role === "DOCTOR"
        ? "/doctor/settings"
        : "/patient/settings"

  const handleSignOutAction = async () => {
    if (onSignOut) {
      onSignOut()
    } else {
      await authClient.signOut()
      refetch()
      router.push("/")
      router.refresh()
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Telehealth"
            width={36}
            height={36}
            className="size-8.5 rounded-xl object-cover"
            suppressHydrationWarning
          />
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Telehealth
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions & Auth State */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-muted-foreground hover:text-foreground"
          />

          {isAuth ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (onDashboard) onDashboard()
                  else router.push(workspacePath)
                }}
                className="hidden sm:inline-flex h-9 rounded-xl border-border/80 text-xs font-semibold hover:bg-muted"
              >
                <LayoutDashboard className="mr-1.5 size-3.5 text-primary" />
                Dashboard
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-full p-0.5 ring-1 ring-border/80 hover:ring-primary/50 transition focus:outline-none"
                      aria-label="User profile menu"
                    >
                      <Avatar className="size-8">
                        {user?.image ? (
                          <AvatarImage
                            src={user.image}
                            alt={user.name || "User"}
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="size-3.5 text-muted-foreground mr-1 hidden sm:inline-block" />
                    </button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl p-1.5 shadow-lg border-border/80"
                >
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user?.name || "User Account"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-normal">
                      {user?.email || ""}
                    </p>
                    {user?.role && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {user.role}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => router.push(workspacePath)}
                      className="cursor-pointer rounded-lg text-xs"
                    >
                      <LayoutDashboard className="mr-2 size-3.5 text-muted-foreground" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(appointmentsPath)}
                      className="cursor-pointer rounded-lg text-xs"
                    >
                      <Calendar className="mr-2 size-3.5 text-muted-foreground" />
                      Appointments
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(recordsPath)}
                      className="cursor-pointer rounded-lg text-xs"
                    >
                      <FileText className="mr-2 size-3.5 text-muted-foreground" />
                      Medical Records
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(settingsPath)}
                      className="cursor-pointer rounded-lg text-xs"
                    >
                      <Settings className="mr-2 size-3.5 text-muted-foreground" />
                      Account Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOutAction}
                    className="cursor-pointer rounded-lg text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="mr-2 size-3.5" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (onSignIn) onSignIn()
                  else router.push("/sign-in")
                }}
                className="hidden sm:inline-flex h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (onCreateAccount) onCreateAccount()
                  else router.push("/patient/appointments/book")
                }}
                className="h-9 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                Book Consultation
              </Button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 md:hidden text-muted-foreground hover:text-foreground"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-border/80 bg-background text-foreground p-0 flex flex-col justify-between"
            >
              <div>
                <SheetHeader className="p-5 border-b border-border/80">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <Image
                      src="/logo.png"
                      alt="Telehealth"
                      width={28}
                      height={28}
                      className="size-7 rounded-lg object-cover"
                    />
                    <span className="font-bold text-base">Telehealth</span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 p-3">
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-primary/10 font-bold text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <SheetFooter className="p-4 border-t border-border/80 flex-col gap-2">
                {isAuth ? (
                  <div className="w-full space-y-2">
                    <Button
                      onClick={() => {
                        setMobileOpen(false)
                        router.push(workspacePath)
                      }}
                      className="w-full h-10 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <LayoutDashboard className="mr-2 size-3.5" />
                      Open Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileOpen(false)
                        handleSignOutAction()
                      }}
                      className="w-full h-10 rounded-xl border-border/80 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="mr-2 size-3.5" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="w-full space-y-2">
                    <Button
                      onClick={() => {
                        setMobileOpen(false)
                        router.push("/patient/appointments/book")
                      }}
                      className="w-full h-10 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Book Consultation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileOpen(false)
                        router.push("/sign-in")
                      }}
                      className="w-full h-10 rounded-xl border-border/80 text-xs font-semibold"
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
