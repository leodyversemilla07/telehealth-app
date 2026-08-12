import type { z } from "zod"
import type {
  consultationSchema,
  consultationWithPrescriptionsSchema,
  doctorPatientItemSchema,
  doctorPatientRecordsSchema,
  patientMedicalHistorySchema,
  prescriptionSchema,
  prescriptionWithConsultationSchema,
} from "../schemas/record.schema.js"

export type ConsultationDto = z.infer<typeof consultationSchema>
export type PrescriptionDto = z.infer<typeof prescriptionSchema>
export type PrescriptionWithConsultationDto = z.infer<
  typeof prescriptionWithConsultationSchema
>
export type ConsultationWithPrescriptionsDto = z.infer<
  typeof consultationWithPrescriptionsSchema
>

export type DoctorPatientItemDto = z.infer<typeof doctorPatientItemSchema>
export type PatientMedicalHistoryDto = z.infer<
  typeof patientMedicalHistorySchema
>
export type DoctorPatientRecordsDto = z.infer<typeof doctorPatientRecordsSchema>
