import { Skeleton } from "@workspace/ui/components/skeleton"
import { AuthLayout } from "@/components/auth-layout"

interface AuthLoadingProps {
  variant: "sign-in" | "sign-up" | "center"
  /** sign-in/sign-up show the social-login row; forgot/reset don't */
  withSocials?: boolean
  /** number of labelled field rows to shimmer */
  fields?: number
}

/**
 * Route-level loading state for auth pages. Must mirror the final page
 * (AuthLayout shell + skeleton form) so the swap is seamless instead of
 * a bare, un-anchored skeleton blob.
 */
export function AuthLoading({
  variant,
  withSocials = true,
  fields = 2,
}: AuthLoadingProps) {
  return (
    <AuthLayout variant={variant}>
      <div className="flex flex-col gap-6" aria-busy="true">
        {/* brand + title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-36 rounded" />
        </div>

        {/* labelled fields */}
        <div className="space-y-4">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        {/* consent / divider / socials */}
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="flex items-center gap-3 py-1">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-3 w-8 rounded" />
            <Skeleton className="h-px flex-1" />
          </div>
          {withSocials ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : (
            <Skeleton className="h-10 w-full rounded-xl" />
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
