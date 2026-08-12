import { z } from "zod"
import { paginationInput } from "../trpc/contracts.util"

/**
 * Zod contracts for the records router — the single source of truth for
 * procedure inputs (the class-validator DTO mirror was removed).
 */

export const byAppointmentInput = z.object({
  appointmentId: z.string().min(1),
})

export const patientIdInput = z.object({
  patientId: z.string().min(1),
})

export const createPrescriptionInput = z.object({
  medicationName: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  duration: z.string().min(1).max(100),
  instructions: z.string().max(500).optional(),
})

export const createConsultationInput = z.object({
  appointmentId: z.string().min(1),
  doctorNotes: z.string().max(2000).optional(),
  diagnosis: z.string().max(500).optional(),
  plan: z.string().max(2000).optional(),
  prescriptions: z.array(createPrescriptionInput).optional(),
})

export type CreateConsultationInput = z.infer<typeof createConsultationInput>

export { paginationInput }
