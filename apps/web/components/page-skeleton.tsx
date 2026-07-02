import { Skeleton } from "@workspace/ui/components/skeleton"

/**
 * Reusable page loading skeleton for consistent loading states across routes.
 * Matches the card-based layout used throughout the app.
 */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      {/* Header skeleton */}
      <Skeleton className="h-24 rounded-xl" />

      {/* Content skeletons */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/** Compact skeleton for smaller pages (settings, auth, etc.) */
export function CompactSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <Skeleton className="h-16 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/** Table skeleton for data-heavy pages (users, doctors, audit logs) */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <Skeleton className="h-20 rounded-xl" />
      <div className="space-y-1">
        {/* Table header */}
        <Skeleton className="h-10 rounded-lg" />
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
