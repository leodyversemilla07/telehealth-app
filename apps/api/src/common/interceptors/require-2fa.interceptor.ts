import {
  type CallHandler,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { Observable } from "rxjs"

/**
 * Global REST equivalent of the tRPC RolesMiddleware 2FA rule.
 *
 * tRPC blocks privileged sessions (DOCTOR/ADMIN) without 2FA on
 * privileged-only procedures; the Nest REST controllers (admin, etc.) had no
 * such gate. This interceptor mirrors the same semantics for REST:
 *
 *  - Reads the route's `@Roles` metadata ("ROLES" — the key used by
 *    @thallesp/nestjs-better-auth's global AuthGuard).
 *  - Only routes restricted EXCLUSIVELY to privileged roles (DOCTOR/ADMIN —
 *    i.e. no PATIENT) are gated. Shared routes stay open; public routes have
 *    no roles metadata and pass through untouched.
 *  - A privileged session without `twoFactorEnabled` is rejected with 403 —
 *    identical message to the tRPC path so both surfaces behave alike.
 *
 * Registered in main.ts after guards run, so `request.session` is already
 * resolved by Better Auth.
 */
const PRIVILEGED_ROLES: readonly string[] = ["DOCTOR", "ADMIN"]

interface SessionShape {
  session?: {
    user?: {
      role?: string
      twoFactorEnabled?: boolean
    }
  }
}

@Injectable()
export class Require2FaInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const required = this.reflector.getAllAndOverride<string[]>("ROLES", [
      context.getHandler(),
      context.getClass(),
    ])

    const privilegedOnly =
      !!required &&
      required.length > 0 &&
      required.every((role) => PRIVILEGED_ROLES.includes(role))
    if (!privilegedOnly) {
      return next.handle()
    }

    const request = context
      .switchToHttp()
      .getRequest<SessionShape | undefined>()
    const user = request?.session?.user
    if (!user) {
      // No session → public/guard-rejected route; auth enforcement already
      // happened in the global AuthGuard.
      return next.handle()
    }

    const isPrivilegedUser = PRIVILEGED_ROLES.includes(user.role ?? "")
    if (isPrivilegedUser && !user.twoFactorEnabled) {
      throw new ForbiddenException({
        code: "TWO_FACTOR_REQUIRED",
        message:
          "Two-factor authentication is required for this action. Enable 2FA in Settings → Security.",
      })
    }

    return next.handle()
  }
}
