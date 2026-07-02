import { randomUUID } from "node:crypto"
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common"
import { Observable, tap } from "rxjs"

declare module "express" {
  interface Request {
    requestId?: string
  }
}

/**
 * RequestIdInterceptor
 *
 * Generates a unique request ID for every incoming request and:
 * 1. Attaches it as `X-Request-Id` response header
 * 2. Stores it on the request object for downstream logging
 *
 * This enables end-to-end request tracing across the API, which is critical
 * for debugging production issues and correlating logs with specific requests.
 *
 * Usage: app.useGlobalInterceptors(new RequestIdInterceptor()) in main.ts
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()

    // Use existing request ID from header if provided (for distributed tracing)
    const requestId =
      (request.headers["x-request-id"] as string) || randomUUID()

    // Store on request for downstream use (logging, error responses, etc.)
    request.requestId = requestId

    // Set on response header
    response.setHeader("X-Request-Id", requestId)

    return next.handle().pipe(
      tap(() => {
        // Request completed — ID is already in the response header
      }),
    )
  }
}
