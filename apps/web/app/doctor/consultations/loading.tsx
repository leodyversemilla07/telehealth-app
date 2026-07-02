import { Skeleton } from "@workspace/ui/components/skeleton"

export default function DoctorConsultationsLoading() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      {/* Header */}
      <Skeleton className="h-24 rounded-xl" />

      {/* Tabs */}
      <Skeleton className="h-10 w-72 rounded-lg" />

      {/* Consultation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
