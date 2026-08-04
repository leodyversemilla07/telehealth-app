"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AppointmentDto } from "@workspace/shared"
import { useTRPC } from "@/lib/trpc/client"

// ─── Query Keys ──────────────────────────────────────────────

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
  slots: (doctorId: string, date: string) =>
    [...appointmentKeys.all, "slots", doctorId, date] as const,
}

// ─── Appointments ────────────────────────────────────────────

export function useMyAppointments(limit?: number, offset?: number) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.appointments.findMine.queryOptions({ limit, offset }),
    select: (data) => ({
      ...data,
      // The tRPC output is the raw Prisma shape; the pages consume the
      // shared AppointmentDto contract (what the REST client typed too).
      appointments: data.items as unknown as AppointmentDto[],
    }),
  })
}

export function useAppointment(id: string) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.appointments.findOne.queryOptions({ id }),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    select: (data) => data as unknown as AppointmentDto,
  })
}

export function useBookAppointment() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.appointments.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.appointments.updateStatus.mutationOptions(),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) })
    },
  })
}

export function useCancelAppointment() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.appointments.cancel.mutationOptions(),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) })
    },
  })
}

export function useRescheduleAppointment() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.appointments.reschedule.mutationOptions(),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) })
    },
  })
}

// ─── Availability (slots — served via the availability router) ────────

export function useAvailableSlots(doctorId: string, date: string) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.availability.getAvailableSlots.queryOptions({ doctorId, date }),
    enabled: !!doctorId && !!date,
  })
}
