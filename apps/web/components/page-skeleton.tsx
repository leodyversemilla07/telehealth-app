import { Skeleton } from "@workspace/ui/components/skeleton"

/**
 * Reusable page loading skeleton for consistent loading states across routes.
 * Matches the card-based layout used throughout the app.
 */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4"
      role="status"
      aria-label="Loading page content"
    >
      {/* Header skeleton */}
      <Skeleton className="h-24 rounded-xl" aria-hidden="true" />

      {/* Content skeletons */}
      <div className="space-y-4" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/** Compact skeleton for smaller pages (settings, auth, etc.) */
export function CompactSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div
      className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4"
      role="status"
      aria-label="Loading page content"
    >
      <Skeleton className="h-16 rounded-xl" aria-hidden="true" />
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/** Table skeleton for data-heavy pages (users, doctors, audit logs) */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4"
      role="status"
      aria-label="Loading table content"
    >
      <Skeleton className="h-20 rounded-xl" aria-hidden="true" />
      <div className="space-y-1" aria-hidden="true">
        {/* Table header */}
        <Skeleton className="h-10 rounded-lg" />
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
