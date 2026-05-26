"use client"

import { useQuery } from "@tanstack/react-query"
import type { DoctorProfileDto } from "@workspace/shared"
import { apiClient } from "@/lib/api-client"

// ─── Query Keys ──────────────────────────────────────────────

export const doctorKeys = {
  all: ["doctors"] as const,
  list: (filters?: { specialty?: string; search?: string; sort?: "price" | "name" }) =>
    [...doctorKeys.all, "list", filters] as const,
  detail: (id: string) => [...doctorKeys.all, "detail", id] as const,
}

// ─── Doctor Discovery ────────────────────────────────────────

export function useDoctors(filters?: {
  specialty?: string
  search?: string
  sort?: "price" | "name"
}) {
  return useQuery({
    queryKey: doctorKeys.list(filters),
    queryFn: () =>
      apiClient.get<DoctorProfileDto[]>("/doctors", { params: filters }),
  })
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: () => apiClient.get<DoctorProfileDto>(`/doctors/${id}`),
    enabled: !!id,
  })
}
