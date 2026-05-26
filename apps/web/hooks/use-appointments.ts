"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  AppointmentDto,
  AppointmentStatus,
  AvailableSlotDto,
  CreateAppointmentDto,
  RescheduleAppointmentDto,
} from "@workspace/shared"
import { apiClient } from "@/lib/api-client"

// Re-export doctor hooks from dedicated module for backward compatibility
export { doctorKeys, useDoctors as useApprovedDoctors, useDoctor } from "./use-doctors"

// ─── Query Keys ──────────────────────────────────────────────

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
  slots: (doctorId: string, date: string) =>
    [...appointmentKeys.all, "slots", doctorId, date] as const,
}


// ─── Appointments ────────────────────────────────────────────

export function useMyAppointments() {
  return useQuery({
    queryKey: appointmentKeys.lists(),
    queryFn: () => apiClient.get<AppointmentDto[]>("/appointments"),
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => apiClient.get<AppointmentDto>(`/appointments/${id}`),
    enabled: !!id,
  })
}

export function useBookAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateAppointmentDto) =>
      apiClient.post<AppointmentDto, CreateAppointmentDto>("/appointments", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      apiClient.patch<AppointmentDto, { status: AppointmentStatus }>(
        `/appointments/${id}/status`,
        { status },
      ),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) })
    },
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<AppointmentDto>(`/appointments/${id}/cancel`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) })
    },
  })
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...dto }: RescheduleAppointmentDto & { id: string }) =>
      apiClient.patch<AppointmentDto, RescheduleAppointmentDto>(
        `/appointments/${id}/reschedule`,
        dto,
      ),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) })
    },
  })
}

// ─── Availability ────────────────────────────────────────────

export function useAvailableSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: appointmentKeys.slots(doctorId, date),
    queryFn: () =>
      apiClient.get<AvailableSlotDto[]>(`/availability/${doctorId}/slots`, {
        params: { date },
      }),
    enabled: !!doctorId && !!date,
  })
}


