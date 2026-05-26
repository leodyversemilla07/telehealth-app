import type { z } from "zod"
import type {
  consultationSchema,
  consultationWithPrescriptionsSchema,
  prescriptionSchema,
} from "../schemas/record.schema.js"

export type ConsultationDto = z.infer<typeof consultationSchema>
export type PrescriptionDto = z.infer<typeof prescriptionSchema>
export type ConsultationWithPrescriptionsDto = z.infer<
  typeof consultationWithPrescriptionsSchema
>
