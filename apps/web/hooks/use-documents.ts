"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

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
  return useQuery({
    queryKey: documentKeys.appointment(appointmentId),
    queryFn: () =>
      apiClient.get<MedicalDocumentDto[]>(
        `/documents/appointment/${appointmentId}`,
      ),
    enabled: !!appointmentId,
  })
}

/** The signed-in patient's full document history. */
export function useMyDocuments() {
  return useQuery({
    queryKey: documentKeys.mine(),
    queryFn: () => apiClient.get<MedicalDocumentDto[]>("/documents/patient/me"),
  })
}

interface UploadDocumentInput {
  appointmentId: string
  type?: MedicalDocumentType
  file: File
}

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
