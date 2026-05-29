import { z } from "zod"

export const consultationSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  patientNotes: z.string().nullable(),
  doctorNotes: z.string().nullable(),
  diagnosis: z.string().nullable(),
  plan: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const prescriptionSchema = z.object({
  id: z.string(),
  consultationId: z.string(),
  medicationName: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().nullable(),
  createdAt: z.coerce.date(),
})

/**
 * Prescription with nested consultation data.
 * Returned by GET /records/prescriptions for patients.
 */
export const prescriptionWithConsultationSchema = prescriptionSchema.extend({
  consultation: z.object({
    id: z.string(),
    diagnosis: z.string().nullable(),
    appointment: z.object({
      startTime: z.coerce.date(),
      doctor: z.object({
        id: z.string(),
        specialty: z.string(),
        user: z.object({
          name: z.string().nullable(),
        }),
      }),
    }),
  }),
})

export const consultationWithPrescriptionsSchema = consultationSchema.extend({
  prescriptions: z.array(prescriptionSchema),
  appointment: z.object({
    id: z.string(),
    patientId: z.string().optional(),
    doctorId: z.string().optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    status: z.string().optional(),
    type: z.string().optional(),
    reason: z.string().nullable().optional(),
    symptoms: z.string().nullable().optional(),
    doctor: z.object({
      id: z.string(),
      specialty: z.string(),
      user: z.object({
        name: z.string().nullable(),
      }),
    }),
  }),
  doctor: z
    .object({
      id: z.string(),
      specialty: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string().nullable(),
        image: z.string().url().nullable(),
      }),
    })
    .optional(),
})
