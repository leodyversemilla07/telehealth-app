import type { z } from "zod"
import type { recommendationResponseSchema } from "../schemas/recommendation.schema.js"

export type RecommendationResponseDto = z.infer<typeof recommendationResponseSchema>
