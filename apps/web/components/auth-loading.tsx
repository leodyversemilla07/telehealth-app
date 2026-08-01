import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { AuthLayout } from "@/components/auth-layout"

type AuthVariant = "sign-in" | "sign-up" | "forgot" | "reset"

/**
 * Route-level loading states for the auth pages.
 * All four pages render inside <AuthLayout variant="center"> (centered
 * max-w-sm card) and wrap their form content in a FieldGroup (gap-4).
 * These skeletons mirror each page's exact structure and real control
 * sizes (inputs/buttons are h-8, role toggle h-auto/py-3, consent p-3)
 * so the loading state is proportionate to the actual form.
 */

function FieldSkeleton({
  labelWidth = "w-16",
  label = "Field",
}: {
  labelWidth?: string
  label?: string
}) {
  return (
    <div className="space-y-2">
      <Skeleton
        aria-label={label}
        className={cn("h-3.5 rounded", labelWidth)}
      />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  )
}

function TitleBlockSkeleton({
  withIcon = false,
  titleWidth = "w-52",
  subtitleWidth = "w-40",
}: {
  withIcon?: boolean
  titleWidth?: string
  subtitleWidth?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {withIcon && <Skeleton className="size-8 rounded-md" />}
      <Skeleton className={cn("h-7 rounded-lg", titleWidth)} />
      <Skeleton className={cn("h-4 rounded", subtitleWidth)} />
    </div>
  )
}

function DividerSkeleton() {
  return (
    <div className="flex items-center gap-3 py-1">
      <Skeleton className="h-px flex-1" />
      <Skeleton className="h-3 w-8 rounded" />
      <Skeleton className="h-px flex-1" />
    </div>
  )
}

function SocialsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-8 w-full rounded-lg" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  )
}

function TermsSkeleton() {
  return (
    <div className="space-y-1.5 px-6 text-center">
      <Skeleton className="mx-auto h-3.5 w-full max-w-60 rounded" />
      <Skeleton className="mx-auto h-3.5 w-40 rounded" />
    </div>
  )
}

export function AuthLoading({ variant }: { variant: AuthVariant }) {
  return (
    <AuthLayout variant="center">
      <div className="flex flex-col gap-6" aria-busy="true">
        {/* Mirrors the page's form FieldGroup (internal gap-4) */}
        <div className="space-y-4">
          {variant === "sign-up" ? (
            <TitleBlockSkeleton
              withIcon
              titleWidth="w-44"
              subtitleWidth="w-56"
            />
          ) : variant === "forgot" ? (
            <TitleBlockSkeleton titleWidth="w-44" subtitleWidth="w-72" />
          ) : variant === "reset" ? (
            <TitleBlockSkeleton titleWidth="w-40" subtitleWidth="w-64" />
          ) : (
            <TitleBlockSkeleton titleWidth="w-56" subtitleWidth="w-48" />
          )}

          {variant === "sign-up" && (
            <>
              {/* Full Name — First / Middle / Last */}
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-16 rounded" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              </div>
              <FieldSkeleton labelWidth="w-10" label="Email" />
              <FieldSkeleton labelWidth="w-20" label="Password" />
              <FieldSkeleton labelWidth="w-32" label="Confirm password" />
              {/* I want to join as — Patient / Doctor toggle (py-3 => taller) */}
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28 rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
              {/* DPA consent box (p-3, two lines of text-sm) */}
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          )}

          {variant === "sign-in" && (
            <>
              <FieldSkeleton labelWidth="w-10" label="Email" />
              <FieldSkeleton labelWidth="w-20" label="Password" />
            </>
          )}

          {variant === "forgot" && (
            <FieldSkeleton labelWidth="w-10" label="Email" />
          )}

          {variant === "reset" && (
            <>
              <FieldSkeleton labelWidth="w-28" label="New password" />
              <FieldSkeleton labelWidth="w-36" label="Confirm password" />
            </>
          )}

          <Skeleton className="h-8 w-full rounded-lg" />

          {(variant === "sign-in" || variant === "sign-up") && (
            <>
              <DividerSkeleton />
              <SocialsSkeleton />
            </>
          )}
        </div>

        {variant === "forgot" ? (
          <Skeleton className="mx-auto h-4 w-56 rounded" />
        ) : variant === "sign-in" || variant === "sign-up" ? (
          <TermsSkeleton />
        ) : null}
      </div>
    </AuthLayout>
  )
}
