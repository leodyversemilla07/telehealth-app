"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { type Socket, io as socketIO } from "socket.io-client"
import { apiClient } from "@/lib/api-client"
import { env } from "@/lib/env"

interface Notification {
  id: string
  title: string
  body: string | null
  isRead: boolean
  createdAt: string
}

function getSocketUrl(): string {
  const apiUrl = env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return "http://localhost:3001"
  return apiUrl.replace(/\/api\/?$/, "")
}

export function NotificationBell() {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  // Fetch notifications
  const { data: notificationsResponse, isPending } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      apiClient.get<{ items: Notification[]; total: number }>("/notifications"),
  })
  const notifications = notificationsResponse?.items ?? []

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () =>
      apiClient.get<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
  })

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
    },
  })

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.patch("/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
    },
  })

  // Socket.io for real-time notifications
  useEffect(() => {
    const url = getSocketUrl()

    socketRef.current = socketIO(url, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    })

    socketRef.current.on("notification", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
    })

    socketRef.current.on("connect_error", (err) => {
      console.warn("[NotificationSocket] connection error:", err.message)
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [queryClient])

  const unreadCount = unreadData?.count ?? 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-muted">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
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

        {isPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
