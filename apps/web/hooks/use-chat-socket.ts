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
 * Eliminates the need for 3-second polling on chat messages.
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
    })

    socketRef.current = socket

    // Listen for new chat messages
    socket.on(
      "chat:message",
      (message: { senderId: string; receiverId: string }) => {
        log.debug("Received chat:message event", message)

        // Determine the other participant
        const otherUserId =
          message.senderId === userId ? message.receiverId : message.senderId

        // Invalidate the conversation with that user
        invalidateConversation(otherUserId)
      },
    )

    socket.on("connect_error", (err) => {
      log.warn("Chat socket connection error:", err.message)
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [enabled, userId, invalidateConversation])

  return socketRef
}
