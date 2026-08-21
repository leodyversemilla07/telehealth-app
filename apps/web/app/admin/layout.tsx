"use client"

import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { ShieldAlert } from "lucide-react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs"
import { SidebarAdmin } from "@/components/sidebar-admin"

const NotificationBell = dynamic(
  () =>
    import("@/components/notification-bell").then((m) => m.NotificationBell),
  { ssr: false },
)

import { authClient } from "@/lib/auth-client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()

  const user = session?.user as
    | {
        name?: string | null
        email: string
        role?: string | null
        image?: string | null
        twoFactorEnabled?: boolean
      }
    | undefined

  // Redirect non-admin users to appropriate dashboard (Rules of Hooks: always call)
  useEffect(() => {
    if (!isPending && session) {
      if (user?.role === "PATIENT") {
        router.replace("/patient/dashboard")
      } else if (user?.role === "DOCTOR") {
        router.replace("/doctor/dashboard")
      } else if (
        user?.role === "ADMIN" &&
        !user.twoFactorEnabled &&
        pathname !== "/admin/settings/two-factor"
      ) {
        // 2FA is enforced for admins (server also blocks privileged tRPC).
        router.replace("/admin/settings/two-factor")
      }
    }
  }, [session, isPending, user?.role, user?.twoFactorEnabled, pathname, router])

  // Show loading spinner while session is being determined
  if (isPending) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (user && user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="size-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <ShieldAlert className="size-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                403 - Access Denied
              </h1>
              <p className="text-muted-foreground text-sm">
                This area is restricted to administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SidebarAdmin
        user={{
          name: user?.name || "Admin",
          email: user?.email || "",
          avatar: user?.image || "",
        }}
        role={
          (user?.role?.toLowerCase() ?? "admin") as
            | "admin"
            | "patient"
            | "doctor"
        }
        onLogout={async () => {
          await authClient.signOut()
          router.replace("/sign-in")
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:px-6">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1 size-9" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumbs rootLabel="Admin Dashboard" />
          </div>
          <NotificationBell />
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
