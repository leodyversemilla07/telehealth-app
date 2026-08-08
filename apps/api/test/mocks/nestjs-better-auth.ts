/**
 * Mock for @thallesp/nestjs-better-auth
 * The real package uses ESM (.mjs) which Jest can't parse in CJS mode.
 *
 * Besides the decorators used across the API, this stub also provides an
 * `AuthModule.forRoot(...)` so full-AppModule e2e specs (CRM-style
 * supertest suites) can boot the real module graph. The mock module mounts
 * the Better Auth health route (GET /auth/ok) and registers a global guard
 * that:
 *   - allows @AllowAnonymous endpoints without a session,
 *   - resolves the session via auth.api.getSession using request headers,
 *   - returns 401 when there is no session,
 *   - returns 403 when the session role is not in the @Roles metadata.
 */

import {
  type CanActivate,
  Controller,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"

export const ROLES_KEY = "mock:roles"
export const ALLOW_ANONYMOUS_KEY = "mock:allow-anonymous"

export type UserSession = {
  user: { id: string; role: string; email?: string }
  session?: { id?: string; ipAddress?: string }
}

export const Roles = (roles: string[]) => SetMetadata(ROLES_KEY, roles)

export const AllowAnonymous = () => SetMetadata(ALLOW_ANONYMOUS_KEY, true)

export const Session = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ userSession?: UserSession }>()
    return request.userSession
  },
)

type AuthLike = {
  api: {
    getSession: (req: { headers: Headers }) => Promise<UserSession | null>
  }
}

let authRef: AuthLike | undefined

@Injectable()
class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = (key: string) =>
      Reflect.getMetadata(key, context.getHandler()) ??
      Reflect.getMetadata(key, context.getClass())

    if (metadata(ALLOW_ANONYMOUS_KEY)) return true

    const roles: string[] = metadata(ROLES_KEY) ?? []
    const req = context.switchToHttp().getRequest<{
      userSession?: UserSession
      headers: Record<string, string>
    }>()

    let session = req.userSession
    if (!session && authRef?.api) {
      try {
        session =
          (await authRef.api.getSession({
            headers: new Headers(req.headers),
          })) ?? undefined
        req.userSession = session
      } catch {
        session = undefined
      }
    }

    if (!session?.user?.id) throw new UnauthorizedException()
    if (roles.length > 0 && !roles.includes(session.user.role)) {
      throw new ForbiddenException()
    }
    return true
  }
}

/** Mirrors better-auth's own `/auth/ok` probe (what the proxy health-checks). */
@Controller("auth")
class AuthHealthController {
  @Get("ok")
  @AllowAnonymous()
  ok() {
    return { ok: true }
  }
}

@Module({
  controllers: [AuthHealthController],
  providers: [{ provide: APP_GUARD, useClass: SessionGuard }],
})
class AuthModuleRoot {}

export const AuthModule = {
  forRoot(options: { auth: AuthLike; bodyParser?: unknown }) {
    authRef = options.auth
    return AuthModuleRoot
  },
}
