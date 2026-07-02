import { Skeleton } from "@workspace/ui/components/skeleton"

export default function PatientRecordsLoading() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      {/* Header */}
      <Skeleton className="h-24 rounded-xl" />

      {/* Records list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
