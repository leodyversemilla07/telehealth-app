"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Loader2, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarAdmin } from "@/components/sidebar-admin"
import { authClient } from "@/lib/auth-client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in")
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            Verifying administrative session...
          </p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  const user = session.user as {
    name?: string | null
    email: string
    role?: string | null
    image?: string | null
  }

  if (user.role !== "ADMIN") {
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
      <SidebarAdmin
        user={{
          name: user.name || "Admin",
          email: user.email,
          avatar: user.image || "",
        }}
        onLogout={async () => {
          await authClient.signOut()
          router.replace("/sign-in")
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
