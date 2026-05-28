"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

// ─── Types ───────────────────────────────────────────────────

export interface AvailabilityScheduleDto {
  id: string
  doctorId: string
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string
  slotDuration: number
  createdAt: string
  updatedAt: string
  timeOffs?: TimeOffDto[]
}

export interface SetAvailabilityDto {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
  slotDuration?: number
}

export interface TimeOffDto {
  id: string
  scheduleId: string
  startDate: string
  endDate: string
  reason: string | null
  createdAt: string
}

export interface CreateTimeOffDto {
  startDate: string
  endDate: string
  reason?: string
}

// ─── Query Keys ──────────────────────────────────────────────

export const availabilityKeys = {
  all: ["availability"] as const,
  mine: () => [...availabilityKeys.all, "mine"] as const,
  timeOff: () => [...availabilityKeys.all, "time-off"] as const,
}

// ─── Hooks ───────────────────────────────────────────────────

/**
 * Fetch the logged-in doctor's recurring availability schedule.
 */
export function useMyAvailability() {
  return useQuery({
    queryKey: availabilityKeys.mine(),
    queryFn: () => apiClient.get<AvailabilityScheduleDto>("/availability/mine"),
  })
}

/**
 * Set (upsert) the logged-in doctor's recurring availability schedule.
 */
export function useSetAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: SetAvailabilityDto) =>
      apiClient.put<AvailabilityScheduleDto, SetAvailabilityDto>(
        "/availability",
        dto,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.mine() })
    },
  })
}

/**
 * Fetch the logged-in doctor's custom time-off periods.
 */
export function useMyTimeOff() {
  return useQuery({
    queryKey: availabilityKeys.timeOff(),
    queryFn: () => apiClient.get<TimeOffDto[]>("/availability/time-off"),
  })
}

/**
 * Create a new custom time-off block for the logged-in doctor.
 */
export function useAddTimeOff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateTimeOffDto) =>
      apiClient.post<TimeOffDto, CreateTimeOffDto>(
        "/availability/time-off",
        dto,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.timeOff() })
    },
  })
}

/**
 * Remove an existing time-off block.
 */
export function useDeleteTimeOff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (timeOffId: string) =>
      apiClient.delete<{ success: boolean }>(
        `/availability/time-off/${timeOffId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.timeOff() })
    },
  })
}
