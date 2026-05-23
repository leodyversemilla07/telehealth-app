"use client"

import type { UserDto } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { ArrowRight, LogOut, Shield, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function Page() {
  const router = useRouter()
  const { data: session, isPending, refetch } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    refetch()
  }

  function Skeleton({ className }: { className?: string }) {
    return <div className={`bg-muted animate-pulse rounded-md ${className}`} />
  }

  if (isPending) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 bg-background">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
        <div className="mt-2 flex gap-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-22" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 bg-background">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Next Monorepo
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm text-center leading-relaxed">
          Welcome to our clean full-stack workspace. Access your account or
          create a new one to proceed.
        </p>
        <div className="flex gap-3 pt-2">
          <Button onClick={() => router.push("/sign-in")} className="px-6">
            Sign In
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/sign-up")}
            className="px-6"
          >
            Sign Up
          </Button>
        </div>
      </div>
    )
  }

  const user = session.user as unknown as UserDto
  const isAdmin = user.role === "ADMIN"

  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-card border border-border/40 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
        {/* Subtle decorative mesh */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold uppercase shadow-inner">
            {session.user.name?.[0] || session.user.email[0]}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Welcome, {session.user.name ?? "User"}!
            </h1>
            <p className="text-muted-foreground text-xs font-medium">
              Signed in as {session.user.email}
            </p>
          </div>

          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              Administrator Access
            </span>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          {isAdmin && (
            <Button
              variant="default"
              onClick={() => router.push("/dashboard")}
              className="w-full h-10 gap-2 font-semibold shadow-md shadow-primary/10 hover:shadow-lg transition-all"
            >
              <Shield className="h-4 w-4" />
              Go to Admin Dashboard
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => router.push("/settings")}
            className="w-full h-10 gap-2 font-medium border-border/60 text-muted-foreground hover:text-foreground"
          >
            <User className="h-4 w-4" />
            Profile Settings
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full h-10 gap-2 font-medium border-border/60 text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
