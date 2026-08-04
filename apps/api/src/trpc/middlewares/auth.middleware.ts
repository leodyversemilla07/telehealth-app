import { Injectable } from "@nestjs/common"
import { TRPCError } from "@trpc/server"
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc"
import type { AuthedTrpcContext, BaseTrpcContext } from "../context.types"

/**
 * Rejects unauthenticated calls with tRPC's UNAUTHORIZED code and upgrades
 * the context to an AuthedTrpcContext carrying the session user.
 */
@Injectable()
export class AuthMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ctx = opts.ctx as BaseTrpcContext
    const user = ctx.session?.user

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to do that",
      })
    }

    const nextCtx: AuthedTrpcContext = { ...ctx, user }
    return opts.next({ ctx: nextCtx })
  }
}
