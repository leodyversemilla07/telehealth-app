import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { AlertCircle } from "lucide-react"

interface ErrorAlertProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function ErrorAlert({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex items-start gap-3 shadow-sm max-w-2xl mx-auto",
        className,
      )}
    >
      <AlertCircle className="h-6 w-6 shrink-0" />
      <div className="space-y-1 text-left">
        <h3 className="font-semibold text-sm">{title}</h3>
        {description && (
          <p className="text-xs text-destructive/80 leading-relaxed">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            className="text-xs mt-3 h-8 border-destructive/20 hover:bg-destructive/10"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
