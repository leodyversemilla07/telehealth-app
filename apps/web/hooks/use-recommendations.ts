"use client"

import { useMutation } from "@tanstack/react-query"
import type { RecommendationResponseDto } from "@workspace/shared"
import { apiClient } from "@/lib/api-client"

// ─── Query Keys ──────────────────────────────────────────────

export const recommendationKeys = {
  all: ["recommendations"] as const,
  result: (symptoms: string) =>
    [...recommendationKeys.all, "result", symptoms] as const,
}

// ─── AI Doctor Recommendation ────────────────────────────────

export function useRecommendation() {
  return useMutation({
    mutationFn: ({ symptoms }: { symptoms: string }) =>
      apiClient.post<RecommendationResponseDto, { symptoms: string }>(
        "/recommendations",
        { symptoms },
      ),
  })
}
