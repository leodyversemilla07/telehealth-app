"use client"

import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { ShieldAlert } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs"
import { SidebarAdmin } from "@/components/sidebar-admin"

const NotificationBell = dynamic(
  () => import("@/components/notification-bell").then((m) => m.NotificationBell),
  { ssr: false },
)
import { authClient } from "@/lib/auth-client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const user = session?.user as {
    name?: string | null
    email: string
    role?: string | null
    image?: string | null
  } | undefined

  if (user && user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6">
        <div className="w-full max-w-md bg-card/40 border border-border/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 size-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

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
      {user ? (
        <SidebarAdmin
          user={{
            name: user.name || "Admin",
            email: user.email,
            avatar: user.image || "",
          }}
          role={(user.role?.toLowerCase() ?? "admin") as "admin" | "patient" | "doctor"}
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
            <DynamicBreadcrumbs rootLabel="Admin Dashboard" />
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
