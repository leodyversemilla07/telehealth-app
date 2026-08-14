"use client"

import { Switch } from "@workspace/ui/components/switch"
import { toast } from "@workspace/ui/components/toast"
import { Bell, Loader2 } from "lucide-react"
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications"

interface NotificationPreferences {
  appointmentReminder: boolean
  appointmentConfirmation: boolean
  appointmentCancelled: boolean
  newMessage: boolean
  scheduleUpdated: boolean
  system: boolean
  pushEnabled: boolean
}

const preferenceLabels: Record<keyof NotificationPreferences, string> = {
  appointmentReminder: "Appointment Reminders",
  appointmentConfirmation: "Appointment Confirmations",
  appointmentCancelled: "Cancellation Notices",
  newMessage: "New Messages",
  scheduleUpdated: "Schedule Updates",
  system: "System Announcements",
  pushEnabled: "Push Notifications",
}

const preferenceDescriptions: Partial<
  Record<keyof NotificationPreferences, string>
> = {
  appointmentReminder: "Get reminded about upcoming appointments",
  appointmentConfirmation: "Receive confirmation when appointments are booked",
  appointmentCancelled: "Get notified when an appointment is cancelled",
  newMessage: "Be notified of new chat messages from your doctor",
  scheduleUpdated: "Get alerts when your doctor updates their schedule",
  system: "Receive important system announcements",
  pushEnabled: "Receive push notifications in your browser",
}

export function NotificationsContent() {
  const { data: prefs, isPending } = useNotificationPreferences()
  const updateMutation = useUpdateNotificationPreferences()

  const toggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return
    updateMutation.mutate(
      { [key]: !prefs[key] },
      {
        onSuccess: () => {
          toast.add({
            title: "Notification preferences updated",
            type: "success",
          })
        },
        onError: () => {
          toast.add({ title: "Failed to update preferences", type: "error" })
        },
      },
    )
  }

  const typeKeys: (keyof NotificationPreferences)[] = [
    "appointmentReminder",
    "appointmentConfirmation",
    "appointmentCancelled",
    "newMessage",
    "scheduleUpdated",
    "system",
  ]

  const channelKeys: (keyof NotificationPreferences)[] = ["pushEnabled"]

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Control what notifications you receive and how they&apos;re delivered
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Notification Types
          </h3>
          <div className="space-y-3">
            {typeKeys.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{preferenceLabels[key]}</p>
                  {preferenceDescriptions[key] && (
                    <p className="text-xs text-muted-foreground">
                      {preferenceDescriptions[key]}
                    </p>
                  )}
                </div>
                <Switch
                  checked={prefs?.[key] ?? true}
                  onCheckedChange={() => toggle(key)}
                  disabled={updateMutation.isPending}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Delivery Channels
          </h3>
          <div className="space-y-3">
            {channelKeys.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Bell className="size-5 text-primary" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {preferenceLabels[key]}
                    </p>
                    {preferenceDescriptions[key] && (
                      <p className="text-xs text-muted-foreground">
                        {preferenceDescriptions[key]}
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={prefs?.[key] ?? key === "pushEnabled"}
                  onCheckedChange={() => toggle(key)}
                  disabled={updateMutation.isPending}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
