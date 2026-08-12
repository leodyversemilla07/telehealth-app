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

/**
 * Row in a doctor's patient list — the shared appointment-derived count per
 * patient. Returned by the records router's `doctorPatients` procedure.
 */
export const doctorPatientItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  appointmentCount: z.number(),
})

/** The medical-history shape surfaced on the doctor's patient detail page. */
export const patientMedicalHistorySchema = z.object({
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
})

/**
 * Full per-patient record bundle a doctor reads for one of their patients
 * (only appointments shared with that doctor). Returned by the records
 * router's `doctorPatientRecords` procedure. Dates are `z.coerce.date()` —
 * the global PhtDateInterceptor converts them to PHT strings on the wire and
 * clients read them back with the shared `toDate` helper.
 */
export const doctorPatientRecordsSchema = z.object({
  patient: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    patientProfile: z
      .object({
        dob: z.coerce.date().nullable(),
        sex: z.string().nullable(),
        phone: z.string().nullable(),
        address: z.string().nullable(),
        philhealthNumber: z.string().nullable(),
        weight: z.number().nullable(),
        height: z.number().nullable(),
        medicalHistory: patientMedicalHistorySchema.nullable(),
      })
      .nullable(),
  }),
  appointments: z.array(
    z.object({
      id: z.string(),
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      status: z.string(),
      reason: z.string().nullable(),
      symptoms: z.string().nullable(),
      type: z.string(),
      consultation: z
        .object({
          id: z.string(),
          diagnosis: z.string().nullable(),
          doctorNotes: z.string().nullable(),
          plan: z.string().nullable(),
          patientNotes: z.string().nullable(),
          prescriptions: z.array(
            z.object({
              id: z.string(),
              medicationName: z.string(),
              dosage: z.string(),
              frequency: z.string(),
              duration: z.string(),
              instructions: z.string().nullable(),
            }),
          ),
        })
        .nullable(),
    }),
  ),
})
