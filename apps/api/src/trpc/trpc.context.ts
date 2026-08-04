import { Injectable } from "@nestjs/common"
import { fromNodeHeaders } from "better-auth/node"
import type { ContextOptions, TRPCContext } from "nestjs-trpc"
import { auth } from "../auth/auth"
import type { BaseTrpcContext } from "./context.types"

/**
 * Resolves the Better Auth session once per tRPC request and attaches it to
 * the context. Mirror of the reference crm implementation: sessions come from
 * the request cookies (or Authorization header), so the browser's
 * `credentials: "include"` fetch carries auth automatically.
 */
@Injectable()
export class TrpcContext implements TRPCContext {
  async create(opts: ContextOptions): Promise<BaseTrpcContext> {
    const req = "req" in opts ? opts.req : undefined
    const session = req
      ? await auth.api
          .getSession({ headers: fromNodeHeaders(req.headers) })
          .catch(() => null)
      : null
    return { req, session }
  }
}
