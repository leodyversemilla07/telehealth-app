"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Switch } from "@workspace/ui/components/switch"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface NotificationPreferences {
  appointmentReminder: boolean
  appointmentConfirmation: boolean
  appointmentCancelled: boolean
  newMessage: boolean
  scheduleUpdated: boolean
  system: boolean
  pushEnabled: boolean
  emailEnabled: boolean
}

const preferenceLabels: Record<keyof NotificationPreferences, string> = {
  appointmentReminder: "Appointment Reminders",
  appointmentConfirmation: "Appointment Confirmations",
  appointmentCancelled: "Cancellation Notices",
  newMessage: "New Messages",
  scheduleUpdated: "Schedule Updates",
  system: "System Announcements",
  pushEnabled: "Push Notifications",
  emailEnabled: "Email Notifications",
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
  emailEnabled: "Receive notifications via email",
}

export function NotificationsContent() {
  const queryClient = useQueryClient()

  const { data: prefs, isPending } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () =>
      apiClient.get<NotificationPreferences>("/notifications/preferences"),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      apiClient.put<NotificationPreferences>(
        "/notifications/preferences",
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] })
      toast.success("Notification preferences updated")
    },
    onError: () => {
      toast.error("Failed to update preferences")
    },
  })

  const toggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return
    updateMutation.mutate({ [key]: !prefs[key] })
  }

  const typeKeys: (keyof NotificationPreferences)[] = [
    "appointmentReminder",
    "appointmentConfirmation",
    "appointmentCancelled",
    "newMessage",
    "scheduleUpdated",
    "system",
  ]

  const channelKeys: (keyof NotificationPreferences)[] = [
    "pushEnabled",
    "emailEnabled",
  ]

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
                  {key === "pushEnabled" ? (
                    <Bell className="size-5 text-primary" />
                  ) : (
                    <BellOff className="size-5 text-muted-foreground" />
                  )}
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
