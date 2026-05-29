"use client"

import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs"
import { SidebarDoctor } from "@/components/sidebar-doctor"

const NotificationBell = dynamic(
  () => import("@/components/notification-bell").then((m) => m.NotificationBell),
  { ssr: false },
)
import { authClient } from "@/lib/auth-client"

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending || !session) return
    const role = (session.user as { role?: string } | undefined)?.role
    if (role === "PATIENT") {
      router.replace("/patient/dashboard")
    } else if (role === "ADMIN") {
      router.replace("/admin/dashboard")
    }
  }, [session, isPending, router])

  const user = session?.user as {
    name?: string | null
    email: string
    role?: string | null
    image?: string | null
  } | undefined

  return (
    <SidebarProvider>
      <SidebarDoctor
        user={{
          name: user?.name || "Doctor",
          email: user?.email || "",
          avatar: user?.image || "",
        }}
        role={(user?.role?.toLowerCase() ?? "doctor") as "doctor" | "patient" | "admin"}
        onLogout={async () => {
          await authClient.signOut()
          router.replace("/sign-in")
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:px-6">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumbs rootLabel="Doctor Workspace" />
          </div>
          <NotificationBell />
        </header>
        <div className="flex-1">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
