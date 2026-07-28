import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  BOOKED: "text-info border-info bg-info/10",
  CONFIRMED: "text-success border-success bg-success/10",
  IN_PROGRESS: "bg-warning text-warning-foreground animate-pulse",
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
