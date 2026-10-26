export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface SelectOption<TValue extends string = string> {
  value: TValue
  label: string
}
