export type ApiSuccessResponse<T> = {
  data: T
  message?: string
}

export type ApiErrorResponse = {
  statusCode: number
  message: string
  error?: string
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
