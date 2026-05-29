"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { ChatClient } from "./_components/chat-client"

interface UserProfile {
  id: string
  name: string | null
  email: string
  role: string
}

export default function PatientChatPage() {
  const { data: user } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: () => apiClient.get<UserProfile>("/users/me"),
  })

  return <ChatClient currentUserId={user?.id || ""} userRole="PATIENT" />
}
