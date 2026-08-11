"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"
import { type Socket, io as socketIO } from "socket.io-client"
import { chatKeys } from "@/hooks/use-chat"
import { createLogger } from "@/lib/logger"

const log = createLogger("ChatSocket")

/**
 * Real-time chat socket hook.
 *
 * Listens for `chat:message` events from the server and invalidates
 * the conversation query cache so the UI updates instantly.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state tracking
 * - Event listener cleanup on disconnect
 */
export function useChatSocket(userId: string | undefined, enabled = true) {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  const invalidateConversation = useCallback(
    (otherUserId: string) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(otherUserId),
      })
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
    },
    [queryClient],
  )

  useEffect(() => {
    if (!enabled || !userId) return

    const url = typeof window !== "undefined" ? window.location.origin : ""

    const socket = socketIO(url, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    })

    socketRef.current = socket

    // Listen for new chat messages
    const onMessage = (message: { senderId: string; receiverId: string }) => {
      log.debug("Received chat:message event", message)

      // Determine the other participant
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId

      // Invalidate the conversation with that user
      invalidateConversation(otherUserId)
    }

    const onConnectError = (err: Error) => {
      log.warn("Chat socket connection error:", err.message)
    }

    const onReconnect = (attempt: number) => {
      log.debug(`Chat socket reconnected after ${attempt} attempts`)
    }

    // The server broadcasts this when the user's sessions were revoked
    // (e.g. admin ban). Drop to the sign-in page — the session cookie is
    // gone, so protected pages will bounce there anyway.
    const onSessionRevoked = () => {
      log.warn("Session revoked by the server — signing out")
      window.location.href = "/sign-in"
    }

    socket.on("chat:message", onMessage)
    socket.on("connect_error", onConnectError)
    socket.on("reconnect", onReconnect)
    socket.on("session:revoked", onSessionRevoked)

    return () => {
      socket.off("chat:message", onMessage)
      socket.off("connect_error", onConnectError)
      socket.off("reconnect", onReconnect)
      socket.off("session:revoked", onSessionRevoked)
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [enabled, userId, invalidateConversation])

  return socketRef
}
