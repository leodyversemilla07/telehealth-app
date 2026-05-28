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
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarPatient } from "@/components/sidebar-patient"
import { authClient } from "@/lib/auth-client"

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.replace("/sign-in")
      return
    }
    const role = (session.user as { role?: string } | undefined)?.role
    if (role === "DOCTOR") {
      router.replace("/doctor/dashboard")
    } else if (role === "ADMIN") {
      router.replace("/admin/dashboard")
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            Loading patient portal...
          </p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  const user = session.user as {
    name?: string | null
    email: string
    image?: string | null
  }

  return (
    <SidebarProvider>
      <SidebarPatient
        user={{
          name: user.name || "Patient",
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
                  <BreadcrumbPage>Patient Portal</BreadcrumbPage>
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
