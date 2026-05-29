"use client"

import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs"
import { SidebarPatient } from "@/components/sidebar-patient"

const NotificationBell = dynamic(
  () => import("@/components/notification-bell").then((m) => m.NotificationBell),
  { ssr: false },
)
import { authClient } from "@/lib/auth-client"

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending || !session) return
    const role = (session.user as { role?: string } | undefined)?.role
    if (role === "DOCTOR") {
      router.replace("/doctor/dashboard")
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
      {user ? (
        <SidebarPatient
          user={{
            name: user.name || "Patient",
            email: user.email,
            avatar: user.image || "",
          }}
          role={(user.role?.toLowerCase() ?? "patient") as "patient" | "doctor" | "admin"}
          onLogout={async () => {
            await authClient.signOut()
            router.replace("/sign-in")
          }}
        />
      ) : (
        <div className="w-64 border-r border-border/50 bg-sidebar flex flex-col">
          <div className="h-16 border-b border-border/50 px-4 flex items-center">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex-1 p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      )}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:px-6">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumbs rootLabel="Patient Portal" />
          </div>
          <NotificationBell />
        </header>
        <div className="flex-1">
          {isPending ? (
            <div className="flex h-full items-center justify-center p-6">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
