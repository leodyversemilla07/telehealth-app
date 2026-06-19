"use client"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  FileText,
  Heart,
  Key,
  Lock,
  Palette,
  Shield,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

function getSettingsNavItems(role: string): NavItem[] {
  const base = `/${role}/settings`

  const items: NavItem[] = [
    {
      title: "Profile",
      href: `${base}/profile`,
      icon: <User className="h-4 w-4" />,
    },
    {
      title: "Appearance",
      href: `${base}/appearance`,
      icon: <Palette className="h-4 w-4" />,
    },
    {
      title: "Password",
      href: `${base}/password`,
      icon: <Key className="h-4 w-4" />,
    },
    {
      title: "Two-Factor Auth",
      href: `${base}/two-factor`,
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      title: "Sessions",
      href: `${base}/sessions`,
      icon: <Lock className="h-4 w-4" />,
    },
    {
      title: "Security Alerts",
      href: `${base}/alerts`,
      icon: <Shield className="h-4 w-4" />,
    },
  ]

  if (role === "patient") {
    items.splice(1, 0, {
      title: "Health Details",
      href: `${base}/health`,
      icon: <Heart className="h-4 w-4" />,
    })
  }

  // Privacy & Consent for all roles (NPC compliance)
  items.push({
    title: "Privacy & Consent",
    href: `${base}/privacy`,
    icon: <FileText className="h-4 w-4" />,
  })

  if (role === "doctor") {
    items.splice(1, 0, {
      title: "Professional Info",
      href: `${base}/professional`,
      icon: <Stethoscope className="h-4 w-4" />,
    })
  }

  return items
}

export function SettingsLayout({
  children,
  role: userRole,
}: {
  children: React.ReactNode
  /** User role for rendering the correct settings nav items */
  role?: "patient" | "doctor" | "admin"
}) {
  const pathname = usePathname()

  // Infer role from pathname if not explicitly provided
  let resolvedRole = userRole
  if (!resolvedRole && pathname) {
    if (pathname.includes("/patient/settings")) {
      resolvedRole = "patient"
    } else if (pathname.includes("/doctor/settings")) {
      resolvedRole = "doctor"
    } else if (pathname.includes("/admin/settings")) {
      resolvedRole = "admin"
    }
  }

  const navItems = getSettingsNavItems(resolvedRole || "patient")

  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile and account settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-12">
          {/* Mobile/tablet: horizontal scrollable nav */}
          <aside className="w-full lg:w-48 shrink-0">
            <nav
              className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:overflow-x-visible"
              aria-label="Settings"
            >
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={item.href} />}
                    className={cn(
                      "shrink-0 lg:w-full justify-start gap-2",
                      isActive && "bg-muted font-medium",
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Button>
                )
              })}
            </nav>
          </aside>

          <Separator className="my-4 lg:hidden" />

          <div className="flex-1 min-w-0">
            <section className="max-w-xl space-y-12">{children}</section>
          </div>
        </div>
      </div>
    </div>
  )
}
