"use client"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { Home, Loader2, LogOut, Shield, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  // Redirect to sign-in if completely unauthenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in")
    }
  }, [session, isPending, router])

  async function handleSignOut() {
    await authClient.signOut()
    router.replace("/sign-in")
  }

  // 1. Loading Skeleton Shell
  if (isPending) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            Verifying administrative session...
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

  // 2. 403 Access Denied Screen (Non-Admin Users)
  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6">
        <div className="w-full max-w-md bg-card/40 border border-border/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center text-center gap-6">
            <div className="h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <ShieldAlert className="h-8 w-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                403 - Access Denied
              </h1>
              <p className="text-muted-foreground text-sm">
                This area is restricted to administrators. Your current account
                does not have permission to view this resource.
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <div className="bg-muted/50 rounded-xl p-3 border border-border/30 text-left flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold uppercase">
                  {user.name?.[0] || user.email[0]}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user.name || "Standard User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user.email} (Role: {user.role || "PATIENT"})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 3. Authorized Admin Dashboard Layout Shell
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm text-foreground flex items-center gap-1.5">
                Telehealth Platform{" "}
                <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                  ADMIN
                </span>
              </span>
              <p className="text-[10px] text-muted-foreground">
                System Administration Portal
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <span className="text-foreground border-b-2 border-primary h-16 flex items-center font-semibold">
              Users Management
            </span>
          </nav>

          <div className="flex items-center gap-4">
            {/* Logged in admin display */}
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {session.user.name || "Administrator"}
                </p>
                <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                  {session.user.email}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-semibold uppercase">
                {session.user.name?.[0] || session.user.email[0]}
              </div>
            </div>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/")}
                title="Go Home"
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign Out"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Workspace */}
      <main className="flex-1 bg-muted/20">
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  )
}
