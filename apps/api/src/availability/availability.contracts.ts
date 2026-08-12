import { z } from "zod"
import { isIsoDate } from "../trpc/contracts.util"
import { isValidDayWindowJson } from "./day-window.util"

/**
 * Zod contracts for the availability router — the single source of truth
 * for procedure inputs (the class-validator DTO mirror was removed).
 */

const daySchedule = z
  .string()
  .refine(isValidDayWindowJson, {
    message:
      "must be a JSON array of HH:MM-HH:MM windows (end after start, within 00:00-24:00)",
  })
  .optional()

export const setAvailabilityInput = z.object({
  monday: daySchedule,
  tuesday: daySchedule,
  wednesday: daySchedule,
  thursday: daySchedule,
  friday: daySchedule,
  saturday: daySchedule,
  sunday: daySchedule,
  slotDuration: z.number().int().min(15).max(120).optional(),
})

export const createTimeOffInput = z.object({
  startDate: z.string().refine(isIsoDate, {
    message: "startDate must be a valid ISO 8601 date",
  }),
  endDate: z.string().refine(isIsoDate, {
    message: "endDate must be a valid ISO 8601 date",
  }),
  reason: z.string().optional(),
})

export const timeOffIdInput = z.object({
  id: z.string().min(1),
})

export const doctorIdInput = z.object({
  doctorId: z.string().min(1),
})

export const availableSlotsInput = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Invalid date format. Use YYYY-MM-DD.",
  }),
})

export type SetAvailabilityInput = z.infer<typeof setAvailabilityInput>
export type CreateTimeOffInput = z.infer<typeof createTimeOffInput>
