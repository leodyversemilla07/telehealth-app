import { Spinner } from "@workspace/ui/components/spinner"

export default function PatientLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Loading Patient Portal...
        </p>
      </div>
    </div>
  )
}
