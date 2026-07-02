import { Skeleton } from "@workspace/ui/components/skeleton"

export default function DoctorScheduleLoading() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      {/* Header */}
      <Skeleton className="h-20 rounded-xl" />

      {/* Weekly schedule grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 rounded-lg" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-12 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
