import { AppointmentStatus, VisitType } from "@telehealth/db"
import { z } from "zod"
import { isIsoDate } from "../trpc/contracts.util"

/**
 * Zod contracts for the appointments router — the tRPC equivalent of the
 * class-validator DTOs (CreateAppointmentDto / RescheduleAppointmentDto /
 * UpdateAppointmentStatusDto / PaginationDto).
 */

export const appointmentIdInput = z.object({
  id: z.string().min(1),
})

export const paginationInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
})

const isoDateTime = z.string().refine(isIsoDate, {
  message: "must be a valid ISO 8601 timestamp",
})

export const createAppointmentInput = z.object({
  doctorId: z.string().min(1),
  scheduleId: z.string().min(1),
  startTime: isoDateTime,
  endTime: isoDateTime,
  reason: z.string().max(2000).optional(),
  symptoms: z.string().max(5000).optional(),
  type: z.nativeEnum(VisitType).optional(),
})

export const updateAppointmentStatusInput = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(AppointmentStatus),
})

export const rescheduleAppointmentInput = z.object({
  id: z.string().min(1),
  startTime: isoDateTime,
  endTime: isoDateTime,
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentInput>
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusInput
>
export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentInput
>
export type PaginationInput = z.infer<typeof paginationInput>
