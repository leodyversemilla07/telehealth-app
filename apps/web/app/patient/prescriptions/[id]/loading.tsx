import { Skeleton } from "@workspace/ui/components/skeleton"

export default function PrescriptionDetailLoading() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <Skeleton className="h-12 w-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}
