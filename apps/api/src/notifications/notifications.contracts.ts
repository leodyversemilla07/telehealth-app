import { z } from "zod"

/** Pagination for the notification list. */
export const notificationListInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
})

/** Partial notification-preferences update. */
export const notificationPreferencesInput = z.object({
  appointmentReminder: z.boolean().optional(),
  appointmentConfirmation: z.boolean().optional(),
  appointmentCancelled: z.boolean().optional(),
  newMessage: z.boolean().optional(),
  scheduleUpdated: z.boolean().optional(),
  system: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
})

export const notificationIdInput = z.object({ id: z.string() })

export type NotificationListInput = z.infer<typeof notificationListInput>
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesInput
>
export type NotificationIdInput = z.infer<typeof notificationIdInput>
