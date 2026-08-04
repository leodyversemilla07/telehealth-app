"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
    select: (data) => data.items,
  })
}

export function usePatientPrescriptions() {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.records.myPrescriptions.queryOptions({}),
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

/** Patient row shown in the doctor's patient list. */
export interface DoctorPatientItem {
  id: string
  name: string | null
  email: string
  appointmentCount: number
}

/**
 * Per-patient record bundle (PHT-formatted dates at runtime, mirroring the
 * REST contract the page was written against). The tRPC output is the raw
 * Prisma shape, so we cast at the boundary.
 */
export interface DoctorPatientRecordsDto {
  patient: {
    id: string
    name: string | null
    email: string
    patientProfile: {
      dob: string | null
      sex: string | null
      phone: string | null
      address: string | null
      philhealthNumber: string | null
      weight: number | null
      height: number | null
      medicalHistory: {
        allergies?: string[]
        conditions?: string[]
        medications?: string[]
      } | null
    } | null
  }
  appointments: Array<{
    id: string
    startTime: string
    endTime: string
    status: string
    reason: string | null
    symptoms: string | null
    type: string
    consultation: {
      id: string
      diagnosis: string | null
      doctorNotes: string | null
      plan: string | null
      patientNotes: string | null
      prescriptions: Array<{
        id: string
        medicationName: string
        dosage: string
        frequency: string
        duration: string
        instructions: string | null
      }>
    } | null
  }>
}

export function useDoctorPatients() {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.records.doctorPatients.queryOptions({}),
    select: (data) => data.items as unknown as DoctorPatientItem[],
  })
}

export function useDoctorPatientRecords(patientId: string) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.records.doctorPatientRecords.queryOptions({ patientId }),
    enabled: !!patientId,
    select: (data) => data as unknown as DoctorPatientRecordsDto,
  })
}
