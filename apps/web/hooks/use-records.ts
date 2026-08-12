"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useTRPC } from "@/lib/trpc/client"

// ─── Query Keys ──────────────────────────────────────────────

export const recordKeys = {
  all: ["records"] as const,
  lists: () => [...recordKeys.all, "list"] as const,
  detail: (id: string) => [...recordKeys.all, "detail", id] as const,
  prescriptions: () => [...recordKeys.all, "prescriptions"] as const,
}

// ─── Patient Records ─────────────────────────────────────────

export function usePatientRecords() {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.records.myRecords.queryOptions({}),
    placeholderData: keepPreviousData,
    select: (data) => data.items,
  })
}

export function usePatientPrescriptions() {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.records.myPrescriptions.queryOptions({}),
    placeholderData: keepPreviousData,
    select: (data) => data.items,
  })
}

// ─── Appointment-scoped consultation ─────────────────────────

export function useAppointmentConsultation(appointmentId: string) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.records.byAppointment.queryOptions({ appointmentId }),
    enabled: !!appointmentId,
    staleTime: 0,
    refetchOnMount: true,
  })
}

// ─── Doctor Mutations ────────────────────────────────────────

export function useCreateConsultation() {
  const trpc = useTRPC()
  const qc = useQueryClient()
  return useMutation({
    ...trpc.records.create.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: recordKeys.lists() }),
  })
}

// ─── Doctor: patient list + per-patient records ─────────────

export function useDoctorPatients() {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.records.doctorPatients.queryOptions({}),
    select: (data) => data.items,
  })
}

export function useDoctorPatientRecords(patientId: string) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.records.doctorPatientRecords.queryOptions({ patientId }),
    enabled: !!patientId,
  })
}
