import { Injectable, Logger } from "@nestjs/common"
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc"

/**
 * Request logging for tRPC procedures. The global Nest HTTP pipeline
 * (nestjs-pino HTTP logger) does not run for tRPC, so this replaces it for
 * the /api/trpc path.
 */
@Injectable()
export class LoggingMiddleware implements TRPCMiddleware {
  private readonly logger = new Logger("tRPC")

  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const startedAt = Date.now()
    const result = await opts.next()
    const durationMs = Date.now() - startedAt

    this.logger.log(
      `${opts.type} ${opts.path} ${result.ok ? "ok" : "err"} ${durationMs}ms`,
    )

    return result
  }
}
