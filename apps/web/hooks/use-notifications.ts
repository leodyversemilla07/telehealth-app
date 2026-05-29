"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"
import { type Socket, io as socketIO } from "socket.io-client"
import { apiClient } from "@/lib/api-client"
import { env } from "@/lib/env"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  title: string
  body: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface NotificationListResponse {
  items: Notification[]
  total: number
  limit: number
  offset: number
}

export interface UnreadCountResponse {
  count: number
}

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.lists(),
    queryFn: () => apiClient.get<NotificationListResponse>("/notifications"),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () =>
      apiClient.get<UnreadCountResponse>("/notifications/unread-count"),
    refetchInterval: 30_000, // poll every 30s as fallback
  })
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<Notification>(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiClient.patch<Notification>("/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      })
    },
  })
}

// ─── Socket.io Hook ────────────────────────────────────────────────────────

function getSocketUrl(): string {
  // Connect directly to the API if NEXT_PUBLIC_API_URL is configured.
  // This bypasses Next.js dev server rewrite limitations with WebSocket upgrades.
  if (env.NEXT_PUBLIC_API_URL) {
    return env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return ""
}

export function useNotificationSocket() {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
  }, [queryClient])

  useEffect(() => {
    const url = getSocketUrl()

    socketRef.current = socketIO(url, {
      withCredentials: true,
      // Start with polling so the request goes through the Next.js /socket.io
      // rewrite proxy. Socket.io will upgrade to WebSocket automatically.
      transports: ["polling", "websocket"],
    })

    socketRef.current.on("notification", () => {
      invalidateAll()
    })

    socketRef.current.on("connect_error", (err) => {
      console.warn("[NotificationSocket] connection error:", err.message)
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [invalidateAll])
}
