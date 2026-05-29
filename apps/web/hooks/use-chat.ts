"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export interface Conversation {
  otherUser: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  lastMessage: ChatMessage | null
  unreadCount: number
}

export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  conversation: (userId: string) =>
    [...chatKeys.all, "conversation", userId] as const,
  unreadCount: () => [...chatKeys.all, "unread-count"] as const,
}

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => apiClient.get<Conversation[]>("/chat/conversations"),
  })
}

export function useChatMessages(otherUserId: string) {
  return useQuery({
    queryKey: chatKeys.conversation(otherUserId),
    queryFn: () =>
      apiClient.get<ChatMessage[]>(`/chat/conversation/${otherUserId}`),
    enabled: !!otherUserId,
    refetchInterval: 3000,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: chatKeys.unreadCount(),
    queryFn: () => apiClient.get<{ count: number }>("/chat/unread-count"),
    refetchInterval: 10000,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      receiverId: string
      content: string
      appointmentId?: string
    }) => apiClient.post<ChatMessage, typeof data>("/chat/send", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(variables.receiverId),
      })
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
    },
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (senderId: string) => apiClient.post(`/chat/read/${senderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() })
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
    },
  })
}

export interface Contact {
  id: string
  name: string | null
  email: string
  image: string | null
}

export function useContacts() {
  return useQuery({
    queryKey: ["chat", "contacts"],
    queryFn: () => apiClient.get<Contact[]>("/chat/contacts"),
  })
}
