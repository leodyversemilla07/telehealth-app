"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/lib/trpc/client"

/** Check whether the current patient already reviewed an appointment. */
export function useCheckReview(appointmentId: string) {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.reviews.hasReviewed.queryOptions({ appointmentId }),
    enabled: !!appointmentId,
  })
}

export function useCreateReview() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  return useMutation({
    ...trpc.reviews.create.mutationOptions(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: trpc.reviews.myReviews.queryKey(),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.reviews.hasReviewed.queryKey({
          appointmentId: variables.appointmentId,
        }),
      })
    },
  })
}
