/**
 * Mock for @thallesp/nestjs-better-auth
 * The real package uses ESM (.mjs) which Jest can't parse in CJS mode.
 */

import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from "@nestjs/common"

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
