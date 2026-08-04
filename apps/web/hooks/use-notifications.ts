"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"
import { type Socket, io as socketIO } from "socket.io-client"
import { createLogger } from "@/lib/logger"
import { useTRPC } from "@/lib/trpc/client"

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

// ─── Queries ────────────────────────────────────────────────────────────────

export function useNotifications() {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.notifications.list.queryOptions({}),
  })
}

export function useUnreadCount() {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.notifications.unreadCount.queryOptions(),
    refetchInterval: 30_000, // poll every 30s as fallback
    refetchIntervalInBackground: false, // stop polling when tab is hidden
  })
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.notifications.markAsRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.notifications.list.queryKey({}),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.notifications.unreadCount.queryKey(),
      })
    },
  })
}

export function useMarkAllAsRead() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.notifications.markAllRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.notifications.list.queryKey({}),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.notifications.unreadCount.queryKey(),
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
  const trpc = useTRPC()
  const socketRef = useRef<Socket | null>(null)

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: trpc.notifications.list.queryKey({}),
    })
    queryClient.invalidateQueries({
      queryKey: trpc.notifications.unreadCount.queryKey(),
    })
  }, [queryClient, trpc])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const url = getSocketUrl()

    // Get session token for cross-origin WebSocket auth
    const connectSocket = async (token?: string) => {
      const opts: Record<string, unknown> = {
        withCredentials: true,
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
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

    // Fetch session token for cross-origin WebSocket auth
    // Uses the Better Auth REST endpoint directly for socket initialization
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
