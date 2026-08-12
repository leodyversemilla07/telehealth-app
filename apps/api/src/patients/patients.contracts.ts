import { z } from "zod"

/**
 * Update current patient's profile. Optional fields are only written when
 * present — the service skips falsy `dob`.
 */
export const updatePatientProfileInput = z.object({
  dob: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "dob must be a valid date")
    .optional(),
  sex: z.string().max(20).optional(),
  phone: z.string().max(32).optional(),
  address: z.string().max(255).optional(),
  philhealthNumber: z.string().max(64).optional(),
  weight: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  medicalHistory: z.record(z.string(), z.unknown()).optional(),
})

export type UpdatePatientProfileInput = z.infer<
  typeof updatePatientProfileInput
>
