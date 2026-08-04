import { z } from "zod"
import { isIsoDate } from "../trpc/contracts.util"

/**
 * Zod contracts for the doctors router — the tRPC equivalent of the
 * class-validator DTOs (RegisterDoctorDto / UpdateDoctorProfileDto /
 * SearchDoctorsDto). The Rust CLI inlines these into the generated AppRouter.
 */

const pricePerVisitPattern = /^\d+(\.\d{1,2})?$/

export const doctorIdInput = z.object({
  id: z.string().min(1),
})

export const searchDoctorsInput = z.object({
  specialty: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["price", "name"]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
})

export const registerDoctorInput = z.object({
  specialty: z.string().min(1).max(100),
  prcLicenseNumber: z.string().min(1),
  prcLicenseExpiry: z.string().refine(isIsoDate, {
    message: "prcLicenseExpiry must be a valid ISO 8601 date",
  }),
  philhealthAccreditation: z.string().nullable().optional(),
  pdeaS2License: z.string().nullable().optional(),
  pdeaS2Expiry: z
    .string()
    .refine(isIsoDate, {
      message: "pdeaS2Expiry must be a valid ISO 8601 date",
    })
    .nullable()
    .optional(),
  bio: z.string().max(500).nullable().optional(),
  clinicAddress: z.string().nullable().optional(),
  pricePerVisit: z
    .string()
    .regex(pricePerVisitPattern, {
      message:
        "pricePerVisit must be a valid number with up to 2 decimal places",
    })
    .nullable()
    .optional(),
})

export const updateDoctorProfileInput = z.object({
  specialty: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  clinicAddress: z.string().optional(),
  pricePerVisit: z
    .string()
    .regex(pricePerVisitPattern, {
      message:
        "pricePerVisit must be a valid number with up to 2 decimal places",
    })
    .optional(),
})

export type RegisterDoctorInput = z.infer<typeof registerDoctorInput>
export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileInput>
export type SearchDoctorsInput = z.infer<typeof searchDoctorsInput>
