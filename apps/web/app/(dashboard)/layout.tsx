"use client"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  CalendarDays,
  FileText,
  Loader2,
  LogOut,
  Menu,
  Stethoscope,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"

// ── Navigation definitions per role ──────────────────────────────────────────

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

const PATIENT_NAV: NavItem[] = [
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Find Doctors", href: "/doctors", icon: Stethoscope },
  { label: "Medical Records", href: "/medical-records", icon: FileText },
]

const DOCTOR_NAV: NavItem[] = [
  { label: "My Schedule", href: "/my-schedule", icon: Stethoscope },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Consultations", href: "/consultations", icon: FileText },
]

const ADMIN_NAV: NavItem[] = [
  { label: "Users", href: "/dashboard/users", icon: Users },
]

function getNavItems(role: string | null | undefined): NavItem[] {
  switch (role) {
    case "DOCTOR":
      return DOCTOR_NAV
    case "ADMIN":
      return ADMIN_NAV
    default:
      return PATIENT_NAV
  }
}

// ── Sidebar component ────────────────────────────────────────────────────────

function Sidebar({
  navItems,
  pathname,
  onSignOut,
  userName,
  userEmail,
  collapsed,
  onClose,
}: {
  navItems: NavItem[]
  pathname: string
  onSignOut: () => void
  userName: string | null | undefined
  userEmail: string | null | undefined
  collapsed: boolean
  onClose: () => void
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r border-border/40 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Branding */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-md shadow-primary/20">
          K
        </div>
        {!collapsed && (
          <span className="font-bold tracking-tight text-foreground text-base whitespace-nowrap">
            KonsultaMD
          </span>
        )}
        {/* Close button on mobile overlay */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Separator />

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User info + sign out */}
      <div className="p-3 space-y-2 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-semibold uppercase shrink-0">
              {userName?.[0] || userEmail?.[0] || "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground truncate">
                {userName || "User"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={onSignOut}
          className={cn(
            "w-full flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}

// ── Main layout ──────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Auth guard: redirect to sign-in if unauthenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in")
    }
  }, [session, isPending, router])

  const handleSignOut = useCallback(async () => {
    await authClient.signOut()
    router.replace("/sign-in")
  }, [router])

  // Loading state
  if (isPending) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const user = session.user as {
    name?: string | null
    email: string
    role?: string | null
  }

  const navItems = getNavItems(user.role)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex shrink-0">
        <Sidebar
          navItems={navItems}
          pathname={pathname}
          onSignOut={handleSignOut}
          userName={user.name}
          userEmail={user.email}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Mobile overlay sidebar ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="relative z-10 h-full w-64">
            <Sidebar
              navItems={navItems}
              pathname={pathname}
              onSignOut={handleSignOut}
              userName={user.name}
              userEmail={user.email}
              collapsed={false}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar (mobile hamburger + collapse toggle) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/40 bg-background/85 backdrop-blur-md px-4 shrink-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Optional: breadcrumb or page title area */}
          <div className="flex-1" />
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
