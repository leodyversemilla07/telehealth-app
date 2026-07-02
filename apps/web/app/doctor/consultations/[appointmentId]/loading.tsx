import { Skeleton } from "@workspace/ui/components/skeleton"

export default function ConsultationDetailLoading() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <Skeleton className="h-12 w-64 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="lg:col-span-7">
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
