import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  BOOKED:
    "text-sky-600 border-sky-200 bg-sky-50/50 dark:text-sky-400 dark:border-sky-800 dark:bg-sky-950/50",
  CONFIRMED:
    "text-emerald-600 border-emerald-200 bg-emerald-50/50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/50",
  IN_PROGRESS: "bg-amber-500 hover:bg-amber-600 text-white animate-pulse",
  COMPLETED: "bg-secondary text-secondary-foreground",
  CANCELLED: "bg-destructive text-destructive-foreground",
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  BOOKED: "Booked",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase() as AppointmentStatus
  const isSolid =
    normalized === "IN_PROGRESS" ||
    normalized === "COMPLETED" ||
    normalized === "CANCELLED"

  return (
    <Badge
      variant={isSolid ? "default" : "outline"}
      className={cn(
        "text-xs font-bold uppercase",
        STATUS_STYLES[normalized] ?? "text-muted-foreground",
        className,
      )}
    >
      {STATUS_LABELS[normalized] ?? status}
    </Badge>
  )
}
