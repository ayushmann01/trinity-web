export type ApiSuccessEnvelope<TData, TMeta = unknown> = {
  data: TData
  meta?: TMeta
}

export type ApiErrorEnvelope = {
  error: {
    message: string
    details?: unknown
  }
}

export type ApiPaginatedMeta = {
  total: number
  page: number
  pageSize: number
}

export type ListResponse<T> = ApiSuccessEnvelope<T[], ApiPaginatedMeta>
