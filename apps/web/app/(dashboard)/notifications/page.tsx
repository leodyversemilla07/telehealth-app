"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  type Notification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotificationSocket,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications"

const SKELETON_ROWS = ["first", "second", "third", "fourth", "fifth"]

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
    </div>
  )
}

// ─── Notification Item ──────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkAsRead,
  isMarkingRead,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  isMarkingRead: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!notification.isRead) onMarkAsRead(notification.id)
      }}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-200 w-full",
        notification.isRead
          ? "border-border/30 bg-card/60 hover:bg-card"
          : "border-primary/20 bg-primary/5 hover:bg-primary/10 shadow-sm shadow-primary/5",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
          notification.isRead
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        <Bell className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm truncate",
              notification.isRead
                ? "font-medium text-foreground/80"
                : "font-semibold text-foreground",
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 shrink-0"
            >
              New
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Read indicator / action */}
      <div className="shrink-0 pt-0.5">
        {isMarkingRead ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : notification.isRead ? (
          <CheckCheck className="h-4 w-4 text-muted-foreground/50" />
        ) : (
          <Check className="h-4 w-4 text-primary/60 hover:text-primary transition-colors" />
        )}
      </div>
    </button>
  )
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
        <Bell className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">
          No notifications
        </p>
        <p className="text-xs text-muted-foreground">
          You&apos;re all caught up! New notifications will appear here.
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  // Enable real-time socket updates
  useNotificationSocket()

  const { data: notifications, isPending, error } = useNotifications()
  const { data: unreadData } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const unreadCount = unreadData?.count ?? 0
  const items = notifications?.items ?? []

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id, {
      onError: (err) => toast.error(err.message || "Failed to mark as read"),
    })
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: (err) =>
        toast.error(err.message || "Failed to mark all as read"),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay updated with your latest alerts and messages.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            All Notifications
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/20"
              >
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive font-medium">
                Failed to load notifications
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                {error.message || "Something went wrong."}
              </p>
            </div>
          )}

          {/* Loading skeletons */}
          {isPending && (
            <div className="space-y-2">
              {SKELETON_ROWS.map((row) => (
                <NotificationSkeleton key={row} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isPending && !error && items.length === 0 && <EmptyState />}

          {/* Notification items */}
          {!isPending &&
            items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                isMarkingRead={
                  markAsRead.isPending &&
                  markAsRead.variables === notification.id
                }
              />
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
