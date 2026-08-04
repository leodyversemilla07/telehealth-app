import { HttpException, Injectable } from "@nestjs/common"
import { TRPCError } from "@trpc/server"
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc"

type TrpcErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR"

function statusToTrpcCode(status: number): TrpcErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST"
    case 401:
      return "UNAUTHORIZED"
    case 403:
      return "FORBIDDEN"
    case 404:
      return "NOT_FOUND"
    case 409:
      return "CONFLICT"
    case 422:
      return "BAD_REQUEST"
    case 429:
      return "TOO_MANY_REQUESTS"
    default:
      return "INTERNAL_SERVER_ERROR"
  }
}

/**
 * NestJS services throw HttpExceptions (NotFoundException, ConflictException,
 * …). tRPC wraps a non-TRPCError throw as INTERNAL_SERVER_ERROR with the
 * original exception as `cause`. This middleware unwraps that `cause` and
 * re-throws a real TRPCError with the matching tRPC code — preserving the
 * HTTP semantics our services already encode.
 */
@Injectable()
export class DomainErrorMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const result = await opts.next()

    if (result.ok) {
      return result
    }

    const failure = result as { error?: unknown }
    const cause = (failure.error as { cause?: unknown } | undefined)?.cause

    if (cause instanceof HttpException) {
      throw new TRPCError({
        code: statusToTrpcCode(cause.getStatus()),
        message: this.messageFrom(cause),
        cause,
      })
    }

    return result
  }

  private messageFrom(exception: HttpException): string {
    const response = exception.getResponse()
    if (typeof response === "string") return response
    const message = (response as Record<string, unknown>).message
    if (typeof message === "string") return message
    return exception.message
  }
}
