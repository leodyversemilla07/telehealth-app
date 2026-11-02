import { z } from "zod"

/**
 * Shared zod contract helpers for tRPC routers.
 */
export const isIsoDate = (value: string): boolean => {
  const isoPattern =
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/
  return isoPattern.test(value) && !Number.isNaN(Date.parse(value))
}

/** Standard pagination envelope used by list procedures (mirrors PaginationDto). */
export const paginationInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
})

export type PaginationInput = z.infer<typeof paginationInput>
