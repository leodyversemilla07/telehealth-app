"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Loader2, MessageSquare, Search, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import {
  useChatMessages,
  useConversations,
  useMarkAsRead,
  useSendMessage,
} from "@/hooks/use-chat"
import type { Conversation } from "@/hooks/use-chat"

interface ChatClientProps {
  currentUserId: string
  userRole: "PATIENT" | "DOCTOR"
}

export function ChatClient({ currentUserId, userRole }: ChatClientProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [], isPending } = useConversations()
  const { data: messages = [], isPending: messagesLoading } = useChatMessages(selectedUserId || "")
  const sendMessage = useSendMessage()
  const markAsRead = useMarkAsRead()

  const selectedConversation = conversations.find(
    (c) => c.otherUser.id === selectedUserId,
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (selectedUserId) {
      markAsRead.mutate(selectedUserId)
    }
  }, [selectedUserId])

  const handleSend = () => {
    if (!message.trim() || !selectedUserId) return
    sendMessage.mutate(
      { receiverId: selectedUserId, content: message.trim() },
      {
        onSuccess: () => {
          setMessage("")
        },
      },
    )
  }

  const filteredConversations = conversations.filter((c) => {
    const term = searchQuery.toLowerCase()
    return (
      c.otherUser.name?.toLowerCase().includes(term) ||
      c.otherUser.email.toLowerCase().includes(term) ||
      c.lastMessage?.content.toLowerCase().includes(term)
    )
  })

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with your healthcare providers
        </p>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-80 border border-border/40 rounded-xl bg-card shadow-sm flex flex-col">
          <div className="p-3 border-b border-border/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-muted/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isPending ? (
              <div className="p-6 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.otherUser.id}
                  onClick={() => setSelectedUserId(conv.otherUser.id)}
                  className={`w-full p-3 text-left hover:bg-muted/30 transition-colors border-b border-border/10 ${
                    selectedUserId === conv.otherUser.id ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {conv.otherUser.name?.[0] || conv.otherUser.email[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {conv.otherUser.name || conv.otherUser.email}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 border border-border/40 rounded-xl bg-card shadow-sm flex flex-col">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-3 border-b border-border/20 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {selectedConversation?.otherUser.name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {selectedConversation?.otherUser.name || selectedConversation?.otherUser.email}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {userRole === "PATIENT" ? "Doctor" : "Patient"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === currentUserId
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border/20">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
