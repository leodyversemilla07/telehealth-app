import type { z } from "zod"
import type {
  appointmentSchema,
  appointmentStatusSchema,
  availableSlotSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  visitTypeSchema,
} from "../schemas/appointment.schema.js"

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>
export type VisitType = z.infer<typeof visitTypeSchema>
export type AppointmentDto = z.infer<typeof appointmentSchema>
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>
export type RescheduleAppointmentDto = z.infer<typeof rescheduleAppointmentSchema>
export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>
export type AvailableSlotDto = z.infer<typeof availableSlotSchema>
