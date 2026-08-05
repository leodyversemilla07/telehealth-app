"use client"

import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs"
import { SidebarDoctor } from "@/components/sidebar-doctor"

const NotificationBell = dynamic(
  () =>
    import("@/components/notification-bell").then((m) => m.NotificationBell),
  { ssr: false },
)

import { authClient } from "@/lib/auth-client"

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending || !session) return
    const u = session.user as {
      role?: string
      twoFactorEnabled?: boolean
    }
    const role = u.role
    if (role === "PATIENT" && pathname !== "/doctor/register") {
      router.replace("/patient/dashboard")
    } else if (role === "ADMIN") {
      router.replace("/admin/dashboard")
    } else if (
      role === "DOCTOR" &&
      !u.twoFactorEnabled &&
      pathname !== "/doctor/settings/two-factor" &&
      pathname !== "/doctor/register"
    ) {
      // 2FA is enforced for doctors (server also blocks privileged tRPC).
      router.replace("/doctor/settings/two-factor")
    }
  }, [session, isPending, pathname, router])

  const user = session?.user as
    | {
        name?: string | null
        email: string
        role?: string | null
        image?: string | null
      }
    | undefined

  return (
    <SidebarProvider>
      <SidebarDoctor
        user={{
          name: user?.name || "Doctor",
          email: user?.email || "",
          avatar: user?.image || "",
        }}
        role={
          (user?.role?.toLowerCase() ?? "doctor") as
            | "doctor"
            | "patient"
            | "admin"
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
            <DynamicBreadcrumbs rootLabel="Doctor Workspace" />
          </div>
          <NotificationBell />
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
