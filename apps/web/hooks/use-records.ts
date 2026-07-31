"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  ConsultationWithPrescriptionsDto,
  PrescriptionWithConsultationDto,
} from "@workspace/shared"
import { apiClient } from "@/lib/api-client"

// ─── Create DTO types (mirrors API class-validator DTOs) ─────

interface CreatePrescriptionInput {
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

interface CreateConsultationInput {
  appointmentId: string
  doctorNotes?: string
  diagnosis?: string
  plan?: string
  prescriptions?: CreatePrescriptionInput[]
}

// ─── Query Keys ──────────────────────────────────────────────

export const recordKeys = {
  all: ["records"] as const,
  lists: () => [...recordKeys.all, "list"] as const,
  detail: (id: string) => [...recordKeys.all, "detail", id] as const,
  prescriptions: () => [...recordKeys.all, "prescriptions"] as const,
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

// ─── Patient Records ─────────────────────────────────────────

export function usePatientRecords() {
  return useQuery({
    queryKey: recordKeys.lists(),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ConsultationWithPrescriptionsDto>>(
        "/records/consultations",
      ),
    select: (data) => data.items,
  })
}

// ─── Doctor Mutations ────────────────────────────────────────

export function useCreateConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateConsultationInput) =>
      apiClient.post<ConsultationWithPrescriptionsDto>(
        "/records/consultations",
        dto,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.lists() }),
  })
}

export function useAppointmentConsultation(appointmentId: string) {
  return useQuery({
    queryKey: [...recordKeys.all, "appointment", appointmentId],
    queryFn: () =>
      apiClient.get<ConsultationWithPrescriptionsDto | null>(
        `/records/appointment/${appointmentId}`,
      ),
    enabled: !!appointmentId,
    staleTime: 0,
    refetchOnMount: true,
  })
}

// ─── Patient Prescriptions ───────────────────────────────────

export function usePatientPrescriptions() {
  return useQuery({
    queryKey: recordKeys.prescriptions(),
    queryFn: () =>
      apiClient.get<PaginatedResponse<PrescriptionWithConsultationDto>>(
        "/records/prescriptions",
      ),
    select: (data) => data.items,
  })
}
