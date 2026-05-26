import { z } from "zod"

export const recommendationResponseSchema = z.object({
  specialties: z.array(z.string()),
  doctors: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      specialty: z.string(),
      prcLicenseNumber: z.string(),
      philhealthAccreditation: z.string().nullable(),
      bio: z.string().nullable(),
      clinicAddress: z.string().nullable(),
      pricePerVisit: z.number(),
      user: z.object({
        id: z.string(),
        name: z.string().nullable(),
        image: z.string().nullable(),
      }),
    }),
  ),
})
