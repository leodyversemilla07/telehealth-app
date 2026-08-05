import type { Request } from "express"

/**
 * The session user subset tRPC procedures need. `role` mirrors the Better Auth
 * `additionalFields.role` on the User model (PATIENT | DOCTOR | ADMIN).
 */
export type TrpcUser = {
  id: string
  name: string
  email: string
  role?: string
  image?: string | null
  twoFactorEnabled?: boolean
}

export type TrpcSession = {
  user: TrpcUser
  session: {
    id: string
    expiresAt: Date
  }
}

/** Context available to every procedure (auth state resolved lazily). */
export type BaseTrpcContext = {
  req?: Request
  session: TrpcSession | null
}

/** Context after AuthMiddleware ran — a signed-in user is guaranteed. */
export type AuthedTrpcContext = BaseTrpcContext & {
  user: TrpcUser
}
