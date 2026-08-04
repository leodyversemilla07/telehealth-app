"use client"

import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/lib/trpc/client"

// ─── Doctor Discovery ────────────────────────────────────────

export function useDoctors(filters?: {
  specialty?: string
  search?: string
  sort?: "price" | "name"
}) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.doctors.list.queryOptions(filters ?? {}),
  })
}
