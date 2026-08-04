import { z } from "zod"

/**
 * Zod contracts for the documents router. Query procedures only — file upload
 * and streaming remain REST (multipart / byte-range, see DocumentsController).
 */

export const documentsByAppointmentInput = z.object({
  appointmentId: z.string().min(1),
})
