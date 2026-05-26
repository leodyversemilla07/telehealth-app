"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { io as socketIO, type Socket } from "socket.io-client"
import { useEffect, useRef, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { env } from "@/lib/env"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
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
    queryFn: () => apiClient.get<Notification[]>("/notifications"),
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
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
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
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
    },
  })
}

// ─── Socket.io Hook ────────────────────────────────────────────────────────

function getSocketUrl(): string {
  const apiUrl = env.NEXT_PUBLIC_API_URL
  // Strip /api suffix if present (e.g. http://localhost:3001/api → http://localhost:3001)
  return apiUrl.replace(/\/api\/?$/, "")
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
      transports: ["websocket", "polling"],
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
