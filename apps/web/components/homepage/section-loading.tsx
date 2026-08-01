import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Loading previews for the lazy-loaded homepage sections.
 * Each mirrors its real section's wrapper + heading + content shape so
 * sections don't "pop in" or jump layout while their chunk loads.
 */

function HeadingSkeleton({ center = true }: { center?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        center && "items-center text-center",
      )}
    >
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="h-9 w-72 rounded-lg sm:w-96" />
      <Skeleton className="h-5 w-56 rounded sm:w-72" />
    </div>
  )
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-card p-6",
        className,
      )}
    >
      <Skeleton className="mb-4 size-11 rounded-2xl" />
      <Skeleton className="mb-2 h-5 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="mt-2 h-4 w-2/3 rounded" />
    </div>
  )
}

function GridSectionSkeleton({
  id,
  cards = 4,
  cols = "md:grid-cols-2 lg:grid-cols-4",
}: {
  id: string
  cards?: number
  cols?: string
}) {
  return (
    <section
      id={id}
      className="relative scroll-mt-24 py-24 sm:py-32"
      aria-busy="true"
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <HeadingSkeleton />
        <div className={cn("mt-14 grid gap-6", cols)}>
          {Array.from({ length: cards }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function FeaturesSectionLoading() {
  return <GridSectionSkeleton id="features" cards={4} />
}

export function DoctorsSectionLoading() {
  return (
    <GridSectionSkeleton
      id="doctors"
      cards={3}
      cols="md:grid-cols-2 lg:grid-cols-3"
    />
  )
}

export function TestimonialsSectionLoading() {
  return (
    <section
      id="testimonials"
      className="relative scroll-mt-24 py-24 sm:py-32"
      aria-busy="true"
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <HeadingSkeleton />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} className="p-7" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function SymptomCheckerLoading() {
  return (
    <section
      id="symptoms"
      className="relative scroll-mt-24 py-24 sm:py-28"
      aria-busy="true"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <HeadingSkeleton />
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    </section>
  )
}

export function FaqSectionLoading() {
  return (
    <section
      className="relative scroll-mt-24 bg-primary/[0.02] py-24 sm:py-28 dark:bg-transparent"
      aria-busy="true"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <HeadingSkeleton />
        <div className="mt-12 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function SecuritySectionLoading() {
  return (
    <section
      id="security"
      className="relative overflow-hidden py-24 sm:py-32"
      aria-busy="true"
    >
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <HeadingSkeleton />
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-3xl" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function CtaSectionLoading() {
  return (
    <section className="relative py-24 sm:py-28" aria-busy="true">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Skeleton className="h-80 rounded-[2rem] bg-muted/60 sm:h-96" />
      </div>
    </section>
  )
}
