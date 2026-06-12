import { Spinner } from "@workspace/ui/components/spinner"

export default function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  )
}
