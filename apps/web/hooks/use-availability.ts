"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/lib/trpc/client"

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
  const trpc = useTRPC()
  return useQuery(trpc.availability.getMyAvailability.queryOptions())
}

/**
 * Set (upsert) the logged-in doctor's recurring availability schedule.
 */
export function useSetAvailability() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.availability.setAvailability.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.mine() })
    },
  })
}

/**
 * Fetch the logged-in doctor's custom time-off periods.
 */
export function useMyTimeOff() {
  const trpc = useTRPC()
  return useQuery(trpc.availability.getTimeOff.queryOptions())
}

/**
 * Create a new custom time-off block for the logged-in doctor.
 */
export function useAddTimeOff() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.availability.addTimeOff.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.timeOff() })
    },
  })
}

/**
 * Remove an existing time-off block.
 */
export function useDeleteTimeOff() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.availability.deleteTimeOff.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.timeOff() })
    },
  })
}
