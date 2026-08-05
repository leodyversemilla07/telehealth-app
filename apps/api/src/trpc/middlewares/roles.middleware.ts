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

    // F-AUTH-10: 2FA enforcement for privileged roles.
    // When a procedure is restricted to privileged role(s) ONLY (DOCTOR/ADMIN —
    // i.e. it does not include PATIENT), a privileged session without 2FA
    // enabled is blocked. Shared/everyone procedures (which include PATIENT)
    // stay open so they can't brick essential UX. Defense in depth: the web
    // layouts also steer DOCTOR/ADMIN to their 2FA setup screen.
    const PRIVILEGED_ROLES: readonly string[] = ["DOCTOR", "ADMIN"]
    const privilegedOnly =
      !!required &&
      required.length > 0 &&
      required.every((r) => PRIVILEGED_ROLES.includes(r))
    const isPrivilegedUser = PRIVILEGED_ROLES.includes(ctx.user.role ?? "")
    if (privilegedOnly && isPrivilegedUser && !ctx.user.twoFactorEnabled) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Two-factor authentication is required for this action. Enable 2FA in Settings → Security.",
      })
    }

    return opts.next()
  }
}
