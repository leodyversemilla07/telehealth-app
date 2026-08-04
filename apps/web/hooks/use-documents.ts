"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useTRPC } from "@/lib/trpc/client"

export type MedicalDocumentType =
  | "LAB_RESULT"
  | "PRESCRIPTION"
  | "IMAGING"
  | "OTHER"

export interface MedicalDocumentDto {
  id: string
  appointmentId: string
  type: MedicalDocumentType
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  /** Relative URL proxied through the app server (cookie-authenticated). */
  fileUrl: string
}

export const documentKeys = {
  all: ["documents"] as const,
  appointment: (appointmentId: string) =>
    [...documentKeys.all, "appointment", appointmentId] as const,
  mine: () => [...documentKeys.all, "mine"] as const,
}

/** Documents uploaded for a specific appointment (patient or doctor view). */
export function useAppointmentDocuments(appointmentId: string) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.documents.byAppointment.queryOptions({ appointmentId }),
    enabled: !!appointmentId,
  })
}

interface UploadDocumentInput {
  appointmentId: string
  type?: MedicalDocumentType
  file: File
}

/**
 * Upload stays on REST (multipart form-data — tRPC does not handle file
 * uploads; see DocumentsController).
 */
export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, type, file }: UploadDocumentInput) => {
      const form = new FormData()
      form.append("file", file)
      form.append("appointmentId", appointmentId)
      if (type) form.append("type", type)
      return apiClient.post<MedicalDocumentDto>("/documents", form)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: documentKeys.appointment(vars.appointmentId),
      })
      qc.invalidateQueries({ queryKey: documentKeys.mine() })
    },
  })
}
