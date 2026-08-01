import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Route-level loading states for the settings pages.
 *
 * Every settings page renders <SettingsLayout> itself (not a route layout),
 * so its loading file replaces the WHOLE page: the "Settings" heading, the
 * nav sidebar, and the content card. This component mirrors that exact
 * structure — heading + nav rows (lg:flex-row, aside w-48, content
 * max-w-xl) — plus a per-page content skeleton that mirrors each
 * settings/* page's real fields, buttons, and empty states, keeping the
 * loading UI proportionate to the page it replaces.
 */

type SettingsContent =
  | "profile"
  | "health"
  | "professional"
  | "password"
  | "appearance"
  | "sessions"
  | "two-factor"
  | "notifications"
  | "alerts"
  | "privacy"
  | "overview"

function FieldRow({
  labelWidth = "w-16",
  className,
}: {
  labelWidth?: string
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className={cn("h-3.5 rounded", labelWidth)} />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  )
}

function HeadingSkeleton({
  titleWidth = "w-32",
  title = "Settings page",
}: {
  titleWidth?: string
  title?: string
}) {
  return (
    <div>
      <Skeleton
        aria-label={title}
        className={cn("h-6 rounded-lg", titleWidth)}
      />
      <Skeleton className="mt-1.5 h-4 w-full max-w-72 rounded" />
    </div>
  )
}

function SeparatorSkeleton() {
  return <Skeleton className="h-px w-full rounded" />
}

function ContentSkeleton({ content }: { content: SettingsContent }) {
  switch (content) {
    case "profile":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Profile" titleWidth="w-24" />
          <div className="space-y-4">
            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-44 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
            {/* Avatar presets */}
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-full" />
              ))}
            </div>
            {/* Name fields (3-col) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldRow labelWidth="w-16" />
              <FieldRow labelWidth="w-20" />
              <FieldRow labelWidth="w-16" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
          <SeparatorSkeleton />
          {/* Personal Details */}
          <div className="space-y-4">
            <Skeleton className="h-3.5 w-28 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow labelWidth="w-14" />
              <FieldRow labelWidth="w-12" />
            </div>
          </div>
          <SeparatorSkeleton />
          {/* Contact Details */}
          <div className="space-y-4">
            <Skeleton className="h-3.5 w-24 rounded" />
            <FieldRow labelWidth="w-24" />
            <FieldRow labelWidth="w-16" />
            <FieldRow labelWidth="w-28" />
            <Skeleton className="h-8 w-44 rounded-lg" />
          </div>
        </div>
      )

    case "health":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Health Information" titleWidth="w-36" />
          <div className="space-y-4">
            <Skeleton className="h-3.5 w-28 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <FieldRow labelWidth="w-24" />
              <FieldRow labelWidth="w-24" />
            </div>
          </div>
          <SeparatorSkeleton />
          <div className="space-y-4">
            <Skeleton className="h-3.5 w-28 rounded" />
            <FieldRow labelWidth="w-16" />
            <FieldRow labelWidth="w-20" />
            <FieldRow labelWidth="w-36" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>
      )

    case "professional":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Professional Information" titleWidth="w-44" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow labelWidth="w-32" />
              <FieldRow labelWidth="w-32" />
            </div>
            <FieldRow labelWidth="w-40" />
            <FieldRow labelWidth="w-32" />
            <FieldRow labelWidth="w-20" />
            <FieldRow labelWidth="w-24" />
            <FieldRow labelWidth="w-28" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      )

    case "password":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Update Password" titleWidth="w-36" />
          <div className="space-y-4">
            <FieldRow labelWidth="w-32" />
            <FieldRow labelWidth="w-28" />
            <FieldRow labelWidth="w-36" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      )

    case "appearance":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Appearance" titleWidth="w-28" />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
            {/* Tabs */}
            <div className="flex w-full gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-lg" />
              ))}
            </div>
            {/* Selected theme preview card */}
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </div>
      )

    case "sessions":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Browser Sessions" titleWidth="w-36" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )

    case "two-factor":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton
            title="Two-Factor Authentication"
            titleWidth="w-44"
          />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>
      )

    case "notifications":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Notification Preferences" titleWidth="w-44" />
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-3.5 w-40 rounded" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-3.5 w-36 rounded" />
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )

    case "alerts":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Security Alerts" titleWidth="w-32" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      )

    case "privacy":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Privacy & Consent" titleWidth="w-36" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )

    case "overview":
      return (
        <div className="space-y-6" aria-hidden="true">
          <HeadingSkeleton title="Settings" titleWidth="w-28" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      )
  }
}

export function SettingsLoading({
  content = "overview",
  userRole = "patient",
}: {
  content?: SettingsContent
  userRole?: "patient" | "doctor" | "admin"
}) {
  // Mirrors getSettingsNavItems() row count per role.
  const navCount = userRole === "admin" ? 8 : 9

  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <div className="space-y-6" aria-busy="true">
        <div>
          <Skeleton aria-label="Settings" className="h-7 w-40 rounded-lg" />
          <Skeleton className="mt-1 h-4 w-72 rounded" />
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-12">
          {/* Settings nav sidebar skeleton */}
          <aside className="w-full lg:w-48 shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {Array.from({ length: navCount }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg shrink-0" />
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            <section className="max-w-xl space-y-12">
              <ContentSkeleton content={content} />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
