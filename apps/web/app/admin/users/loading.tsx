import { Skeleton } from "@workspace/ui/components/skeleton"

export default function AdminUsersLoading() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      {/* Header with search */}
      <Skeleton className="h-20 rounded-xl" />

      {/* Table */}
      <div className="space-y-1">
        <Skeleton className="h-10 rounded-lg" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
