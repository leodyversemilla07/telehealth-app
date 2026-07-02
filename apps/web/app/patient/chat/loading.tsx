import { Skeleton } from "@workspace/ui/components/skeleton"

export default function PatientChatLoading() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      {/* Header */}
      <Skeleton className="h-20 rounded-xl" />

      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-full lg:w-80 border border-border/40 rounded-xl bg-card shadow-sm flex flex-col">
          <div className="p-3 border-b border-border/20 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-7 flex-1 rounded-md" />
              <Skeleton className="h-7 flex-1 rounded-md" />
            </div>
            <Skeleton className="h-8 rounded-md" />
          </div>
          <div className="flex-1 p-2 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Chat window placeholder */}
        <div className="hidden lg:flex flex-1 border border-border/40 rounded-xl bg-card shadow-sm items-center justify-center">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
