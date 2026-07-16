import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { Request, Response } from "express"
import { codeForStatus, type ErrorCode } from "../errors/error-codes"

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpExceptionFilter")

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal Server Error"

    const rawMessage =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : ((exceptionResponse as Record<string, unknown>).message ??
          "Internal server error")

    // SRS Appendix C / NFR-REL-03: every error carries a machine `code`.
    // Prefer an explicit code attached to the exception; otherwise derive one
    // from the HTTP status using the standardized error-code table.
    const responseObject =
      typeof exceptionResponse === "object" && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : null
    const explicitCode = responseObject?.code
    const code = (
      typeof explicitCode === "string" ? explicitCode : codeForStatus(status)
    ) as ErrorCode

    // Structured details (validation constraints, context, etc.).
    const explicitDetails = responseObject?.details
    const details =
      explicitDetails !== undefined
        ? explicitDetails
        : Array.isArray(rawMessage)
          ? rawMessage
          : undefined

    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage

    // `error` is the human-readable description (mirrors Better Auth's
    // message/code split); `code` is the machine-readable Appendix C code.
    const error = message

    // Log the error for internal tracking (exclude common client-side 4xx errors from high-severity alerts)
    const requestId = (request as unknown as { requestId?: string }).requestId
    const logPrefix = requestId ? `[${requestId}]` : ""
    if (status >= 500) {
      this.logger.error(
        `${logPrefix} [500 Internal Error] Path: ${request.url} | Message: ${
          exception instanceof Error ? exception.stack : message
        }`,
      )
    } else {
      this.logger.warn(
        `${logPrefix} [Client Error] Path: ${request.url} | Status: ${status} | Message: ${message}`,
      )
    }

    // Add rate limit headers when throttled
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      response.setHeader("Retry-After", "60")
      response.setHeader("X-RateLimit-Limit", "30")
      response.setHeader("X-RateLimit-Remaining", "0")
      response.setHeader(
        "X-RateLimit-Reset",
        Math.ceil(Date.now() / 1000 + 60).toString(),
      )
    }

    // Return standardized response shape (SRS NFR-REL-03): every error includes
    // a machine `code` and optional `details`, alongside the human `error`.
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      message,
      error,
      code,
      details,
    })
  }
}
