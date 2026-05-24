import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  )
}
