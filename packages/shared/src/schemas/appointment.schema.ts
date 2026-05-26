import { z } from "zod"

export const appointmentStatusSchema = z.enum([
  "BOOKED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
])

export const visitTypeSchema = z.enum(["VIDEO", "PHONE", "IN_PERSON"])

export const appointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  providerId: z.string(),
  scheduleId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  status: appointmentStatusSchema,
  reason: z.string().nullable(),
  symptoms: z.string().nullable(),
  type: visitTypeSchema,
  roomUrl: z.string().url().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  patient: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  provider: z.object({
    id: z.string(),
    specialty: z.string(),
    user: z.object({
      name: z.string().nullable(),
    }),
  }),
})

export const createAppointmentSchema = z.object({
  providerId: z.string(),
  scheduleId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().optional(),
  symptoms: z.string().optional(),
  type: visitTypeSchema.optional(),
})

export const rescheduleAppointmentSchema = z.object({
  scheduleId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
})

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
})

export const availableSlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  scheduleId: z.string(),
})
