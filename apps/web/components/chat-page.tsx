"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Search,
  Send,
  UserPlus,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import {
  useChatMessages,
  useContacts,
  useConversations,
  useMarkAsRead,
  useSendMessage,
} from "@/hooks/use-chat"
import { useChatSocket } from "@/hooks/use-chat-socket"
import { apiClient } from "@/lib/api-client"

interface UserProfile {
  id: string
  name: string | null
  email: string
  role: string
}

interface ChatPageProps {
  userRole: "PATIENT" | "DOCTOR"
  description: string
  contactSearchPlaceholder: string
  emptyContactsMessage: string
}

export function ChatPage({
  userRole,
  description,
  contactSearchPlaceholder,
  emptyContactsMessage,
}: ChatPageProps) {
  const { data: userData } = useQuery<{ user: UserProfile }>({
    queryKey: ["user-profile"],
    queryFn: () => apiClient.get("/users/me"),
  })

  const currentUserId = userData?.user?.id || ""

  // Real-time chat via Socket.io — eliminates 3-second polling delay
  useChatSocket(currentUserId, true)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showContacts, setShowContacts] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [], isPending } = useConversations()
  const { data: contacts = [], isPending: contactsLoading } = useContacts()
  const { data: messages = [], isPending: messagesLoading } = useChatMessages(
    selectedUserId || "",
  )
  const sendMessage = useSendMessage()
  const markAsRead = useMarkAsRead()

  const selectedConversation = conversations.find(
    (c) => c.otherUser.id === selectedUserId,
  )
  const selectedContact = contacts.find((c) => c.id === selectedUserId)

  const selectedUser = selectedConversation?.otherUser || selectedContact

  // biome-ignore lint/correctness/useExhaustiveDependencies: Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  useEffect(() => {
    if (selectedUserId) {
      markAsRead.mutate(selectedUserId)
    }
  }, [selectedUserId, markAsRead.mutate])

  const handleSend = () => {
    if (!message.trim() || !selectedUserId || sendMessage.isPending) return
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
      c.lastMessage?.content?.toLowerCase().includes(term)
    )
  })

  const filteredContacts = contacts.filter((c) => {
    const term = searchQuery.toLowerCase()
    return (
      c.name?.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    )
  })

  const otherRoleLabel = userRole === "PATIENT" ? "Doctor" : "Patient"

  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Messages
          </CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
        {/* Conversations List */}
        <div
          className={`${
            selectedUserId ? "hidden lg:flex" : "flex"
          } w-full lg:w-80 border border-border/40 rounded-xl bg-card shadow-sm flex-col`}
        >
          <div className="p-3 border-b border-border/20">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant={showContacts ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setShowContacts(false)}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Chats
              </Button>
              <Button
                variant={showContacts ? "ghost" : "secondary"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setShowContacts(true)}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                New Chat
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  showContacts
                    ? contactSearchPlaceholder
                    : "Search conversations..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-muted/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {showContacts ? (
              contactsLoading ? (
                <div className="p-6 text-center">
                  <Spinner className="size-5 text-muted-foreground mx-auto" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {emptyContactsMessage}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <Button
                    variant="ghost"
                    type="button"
                    key={contact.id}
                    onClick={() => {
                      setSelectedUserId(contact.id)
                      setShowContacts(false)
                    }}
                    className="h-auto w-full justify-start rounded-none border-b border-border/10 p-3 text-left hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {contact.name?.[0] || contact.email[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {contact.name || contact.email}
                        </span>
                        <span className="text-xs text-muted-foreground truncate block">
                          {contact.email}
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                ))
              )
            ) : isPending ? (
              <div className="p-6 text-center">
                <Spinner className="size-5 text-muted-foreground mx-auto" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <Button
                  variant="ghost"
                  type="button"
                  key={conv.otherUser.id}
                  onClick={() => setSelectedUserId(conv.otherUser.id)}
                  className={`h-auto w-full justify-start rounded-none border-b border-border/10 p-3 text-left hover:bg-muted/30 ${
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
                          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={`${
            !selectedUserId ? "hidden lg:flex" : "flex"
          } flex-1 border border-border/40 rounded-xl bg-card shadow-sm flex-col`}
        >
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border/20 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  className="mr-1 text-muted-foreground lg:hidden"
                  onClick={() => setSelectedUserId(null)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </Button>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {selectedUser?.name?.[0] || selectedUser?.email?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {selectedUser?.name || selectedUser?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {otherRoleLabel}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading || !currentUserId ? (
                  <div className="text-center py-8">
                    <Spinner className="size-5 text-muted-foreground mx-auto" />
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
                          <p
                            className={`text-xs mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Manila",
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <Separator className="bg-border/20" />
              <div className="p-3">
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
                      <Spinner className="size-4" />
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
