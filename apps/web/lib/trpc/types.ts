import type { inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "api/app-router"

/**
 * Helper type derived from the generated AppRouter — handy for typing client
 * code against procedure outputs without importing the router itself.
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>
