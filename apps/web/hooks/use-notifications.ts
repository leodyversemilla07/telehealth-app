"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"
import { type Socket, io as socketIO } from "socket.io-client"
import { apiClient } from "@/lib/api-client"
import { createLogger } from "@/lib/logger"

const log = createLogger("NotificationSocket")

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
    refetchIntervalInBackground: false, // stop polling when tab is hidden
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
  // Connect to the API server for WebSocket support.
  // In production, nginx proxies WebSocket connections to the API.
  if (typeof window === "undefined") return ""
  return window.location.origin
}

export function useNotificationSocket(enabled = true) {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
  }, [queryClient])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const url = getSocketUrl()

    // Get session token for cross-origin WebSocket auth
    const connectSocket = async (token?: string) => {
      const opts: Record<string, unknown> = {
        withCredentials: true,
        transports: ["polling", "websocket"],
      }
      if (token) {
        opts.auth = { token }
      }
      socketRef.current = socketIO(url, opts)

      socketRef.current.on("notification", () => {
        invalidateAll()
      })

      socketRef.current.on("connect_error", (err) => {
        log.warn("connection error:", err.message)
      })
    }

    // Try to get session token from the auth client's cookie
    // The cookie is accessible because API calls go through same-origin proxy
    fetch("/api/auth/get-session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) connectSocket(data?.session?.token)
      })
      .catch(() => {
        log.debug("Session fetch failed, connecting socket without auth")
        if (!cancelled) connectSocket()
      })

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [enabled, invalidateAll])
}
