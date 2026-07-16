export type ApiSuccessResponse<T> = {
  data: T
  message?: string
}

export type ApiErrorResponse = {
  statusCode: number
  message: string
  /** Human-readable description (SRS NFR-REL-03 envelope). */
  error?: string
  /** Machine-readable SRS Appendix C code, e.g. "CANCELLATION_WINDOW". */
  code?: string
  /** Optional structured details (validation constraints, context, etc.). */
  details?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PaginationQuery = {
  page?: number
  pageSize?: number
}
