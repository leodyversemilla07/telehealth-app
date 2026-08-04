/**
 * Shared zod contract helpers for tRPC routers.
 */
export const isIsoDate = (value: string): boolean =>
  !Number.isNaN(Date.parse(value))
