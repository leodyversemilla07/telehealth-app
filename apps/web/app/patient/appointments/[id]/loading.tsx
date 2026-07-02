import { Skeleton } from "@workspace/ui/components/skeleton"

export default function AppointmentDetailLoading() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      {/* Back button */}
      <Skeleton className="h-8 w-32 rounded-lg" />

      {/* Main card */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Action buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  )
}
