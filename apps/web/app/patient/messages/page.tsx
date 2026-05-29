"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { MessageSquareText } from "lucide-react"

export default function PatientMessagesPage() {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Secure messages from your healthcare providers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="h-4 w-4" />
            Inbox
          </CardTitle>
          <CardDescription>Your messages will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        </CardContent>
      </Card>
    </div>
  )
}
