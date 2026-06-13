"use client"

import { ChatPage } from "@/components/chat-page"

export default function DoctorChatPage() {
  return (
    <ChatPage
      userRole="DOCTOR"
      description="Chat with your patients"
      contactSearchPlaceholder="Search patients..."
      emptyContactsMessage="No patients available to message"
    />
  )
}
