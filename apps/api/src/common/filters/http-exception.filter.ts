import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { Request, Response } from "express"

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

    const message =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>).message ||
          "Internal server error"

    // Log the error for internal tracking (exclude common client-side 4xx errors from high-severity alerts)
    if (status >= 500) {
      this.logger.error(
        `[500 Internal Error] Path: ${request.url} | Message: ${
          exception instanceof Error ? exception.stack : message
        }`,
      )
    } else {
      this.logger.warn(
        `[Client Error] Path: ${request.url} | Status: ${status} | Message: ${message}`,
      )
    }

    // Return standardized response shape matching front-end expectations
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message.join(", ") : message,
      error:
        exception instanceof HttpException
          ? exception.name
          : "InternalServerError",
    })
  }
}
