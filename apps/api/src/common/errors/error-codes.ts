/**
 * SRS Appendix C — standardized API error codes (NFR-REL-03).
 *
 * Every error response includes a machine-readable `code` drawn from this set,
 * so clients (and the docs) can rely on stable identifiers instead of parsing
 * exception class names or message text.
 */
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  SLOT_UNAVAILABLE: "SLOT_UNAVAILABLE",
  CANCELLATION_WINDOW: "CANCELLATION_WINDOW",
  LICENSE_EXPIRED: "LICENSE_EXPIRED",
  PRIVACY_CONSENT_REQUIRED: "PRIVACY_CONSENT_REQUIRED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Default Appendix C code for a given HTTP status, used when an exception does
 * not carry an explicit domain code.
 */
export function codeForStatus(status: number): ErrorCode {
  switch (status) {
    case 401:
      return ERROR_CODES.UNAUTHORIZED
    case 403:
      return ERROR_CODES.FORBIDDEN
    case 404:
      return ERROR_CODES.NOT_FOUND
    case 409:
      return ERROR_CODES.CONFLICT
    case 422:
      return ERROR_CODES.VALIDATION_ERROR
    case 429:
      return ERROR_CODES.RATE_LIMITED
    // 400 has no dedicated Appendix C entry; treat input errors as validation.
    case 400:
      return ERROR_CODES.VALIDATION_ERROR
    default:
      return ERROR_CODES.INTERNAL_ERROR
  }
}
