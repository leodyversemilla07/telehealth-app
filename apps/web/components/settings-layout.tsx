"use client"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  Heart,
  Key,
  Lock,
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
  role,
}: {
  children: React.ReactNode
  role: "patient" | "doctor" | "admin"
}) {
  const pathname = usePathname()
  const navItems = getSettingsNavItems(role)

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile and account settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-12">
          <aside className="w-full max-w-xl lg:w-48 shrink-0">
            <nav className="flex flex-col space-y-1" aria-label="Settings">
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
                      "w-full justify-start gap-2",
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

          <Separator className="my-6 lg:hidden" />

          <div className="flex-1 md:max-w-2xl">
            <section className="max-w-xl space-y-12">{children}</section>
          </div>
        </div>
      </div>
    </div>
  )
}
