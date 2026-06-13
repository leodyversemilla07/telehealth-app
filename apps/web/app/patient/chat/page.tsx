"use client"

import { ChatPage } from "@/components/chat-page"

export default function PatientChatPage() {
  return (
    <ChatPage
      userRole="PATIENT"
      description="Chat with your healthcare providers"
      contactSearchPlaceholder="Search doctors..."
      emptyContactsMessage="No doctors available to message"
    />
  )
}
