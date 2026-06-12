"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Bell, BellOff, BellRing, CheckCheck } from "lucide-react"
import { useState } from "react"
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotificationSocket,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const push = usePushNotifications()

  // Shared hooks with consistent query keys
  const { data: notificationsResponse, isPending } = useNotifications()
  const notifications = notificationsResponse?.items ?? []
  const { data: unreadData } = useUnreadCount()
  const markReadMutation = useMarkAsRead()
  const markAllReadMutation = useMarkAllAsRead()

  // Real-time socket — only connects when dropdown is open
  useNotificationSocket(isOpen)

  const unreadCount = unreadData?.count ?? 0

  // Push toggle label & icon
  const pushLabel = push.isSubscribed
    ? "Push notifications on"
    : push.permission === "denied"
      ? "Push blocked (check browser settings)"
      : "Enable push notifications"

  const PushIcon = push.isSubscribed ? BellRing : BellOff

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-muted"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(320px,calc(100vw-2rem))]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex items-center gap-1">
            {/* Push toggle */}
            {push.isSupported && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={push.isLoading || push.permission === "denied"}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (push.isSubscribed) {
                          push.unsubscribe()
                        } else {
                          push.subscribe()
                        }
                      }}
                      aria-label={pushLabel}
                    >
                      {push.isLoading ? (
                        <Spinner className="h-3 w-3" />
                      ) : (
                        <PushIcon
                          className={`h-3.5 w-3.5 ${push.isSubscribed ? "text-primary" : "text-muted-foreground"}`}
                        />
                      )}
                    </Button>
                  }
                />
                <TooltipContent side="bottom">{pushLabel}</TooltipContent>
              </Tooltip>
            )}
            {/* Mark all read */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        {isPending ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer ${
                  !notification.isRead ? "bg-muted/50" : ""
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markReadMutation.mutate(notification.id)
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {/* Push permission denied hint */}
        {push.isSupported && push.permission === "denied" && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2 text-xs text-muted-foreground">
              Push blocked in browser settings. Enable in Site Settings to
              receive alerts.
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
