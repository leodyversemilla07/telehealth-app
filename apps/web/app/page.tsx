"use client"

import { Button } from "@workspace/ui/components/button"
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
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
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
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">Next Monorepo</h1>
        <p className="text-muted-foreground text-sm">You are not signed in.</p>
        <div className="flex gap-3">
          <Button onClick={() => router.push("/sign-in")}>Sign In</Button>
          <Button variant="outline" onClick={() => router.push("/sign-up")}>
            Sign Up
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Next Monorepo</h1>
      <p className="text-muted-foreground text-sm">
        Welcome, {session.user.name ?? session.user.email}!
      </p>
      <p className="text-muted-foreground text-xs">
        Signed in as {session.user.email}
      </p>
      <Button variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  )
}
