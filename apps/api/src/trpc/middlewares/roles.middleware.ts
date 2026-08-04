import { Injectable } from "@nestjs/common"
import { TRPCError } from "@trpc/server"
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc"
import type { AuthedTrpcContext } from "../context.types"

/**
 * Role-based access control for tRPC. The telehealth app is multi-role
 * (PATIENT / DOCTOR / ADMIN) — the reference crm repo had no roles at all.
 *
 * Roles are declared per procedure via the decorator's `meta`:
 *   @Query({ input: x, meta: { roles: ["DOCTOR"] } })
 * When `meta.roles` is absent, any authenticated user passes (like @Roles
 * omitted). Run AFTER AuthMiddleware.
 */
@Injectable()
export class RolesMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ctx = opts.ctx as AuthedTrpcContext
    const required = (opts.meta as { roles?: string[] } | undefined)?.roles
    if (required && !required.includes(ctx.user.role ?? "")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to do that",
      })
    }
    return opts.next()
  }
}
