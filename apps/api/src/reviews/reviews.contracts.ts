import { z } from "zod"

/** Leave a review for a completed appointment (mirrors CreateReviewDto). */
export const createReviewInput = z.object({
  appointmentId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

/** Public doctor-reviews listing (mirrors the retired GET /reviews/doctor/:doctorId). */
export const reviewsByDoctorInput = z.object({
  doctorId: z.string(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
})

/** Check whether the current patient reviewed an appointment. */
export const reviewCheckInput = z.object({ appointmentId: z.string() })

export type CreateReviewInput = z.infer<typeof createReviewInput>
export type ReviewsByDoctorInput = z.infer<typeof reviewsByDoctorInput>
export type ReviewCheckInput = z.infer<typeof reviewCheckInput>
