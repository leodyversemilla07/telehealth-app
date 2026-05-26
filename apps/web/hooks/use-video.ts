"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

// ─── Types ───────────────────────────────────────────────────

export interface JoinRoomResponse {
  token: string
  url: string
}

export interface EndRoomResponse {
  success: boolean
}

// ─── Query Keys ──────────────────────────────────────────────

export const videoKeys = {
  all: ["video"] as const,
  room: (appointmentId: string) =>
    [...videoKeys.all, "room", appointmentId] as const,
}

// ─── Mutations ───────────────────────────────────────────────

export function useJoinRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId }: { appointmentId: string }) =>
      apiClient.post<JoinRoomResponse, { appointmentId: string }>(
        "/video/join",
        { appointmentId },
      ),
    onSuccess: (_data, { appointmentId }) => {
      queryClient.invalidateQueries({
        queryKey: videoKeys.room(appointmentId),
      })
    },
  })
}

export function useEndRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId }: { appointmentId: string }) =>
      apiClient.post<EndRoomResponse, { appointmentId: string }>(
        "/video/end",
        { appointmentId },
      ),
    onSuccess: (_data, { appointmentId }) => {
      queryClient.invalidateQueries({
        queryKey: videoKeys.room(appointmentId),
      })
    },
  })
}
