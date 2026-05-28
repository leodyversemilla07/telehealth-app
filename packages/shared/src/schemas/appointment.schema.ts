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
  doctorId: z.string(),
  scheduleId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  status: appointmentStatusSchema,
  reason: z.string().nullable(),
  symptoms: z.string().nullable(),
  type: visitTypeSchema,
  roomUrl: z.string().nullable().optional(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  patient: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  doctor: z.object({
    id: z.string(),
    specialty: z.string(),
    pricePerVisit: z.number().nullable().optional(),
    user: z.object({
      id: z.string().optional(),
      name: z.string().nullable(),
      email: z.string().optional(),
      image: z.string().nullable().optional(),
    }),
  }),
})

export const createAppointmentSchema = z.object({
  doctorId: z.string(),
  scheduleId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().optional(),
  symptoms: z.string().optional(),
  type: visitTypeSchema.optional(),
})

export const rescheduleAppointmentSchema = z.object({
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
  available: z.boolean().optional(),
})
