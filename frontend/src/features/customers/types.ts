import type { PocketCurrency } from '@/features/pockets/types'

export type CustomerStatus = 'active' | 'locked'

export interface Customer {
  id: string
  phone: string
  displayName?: string | null
  status: CustomerStatus
  createdAt?: string | number
  updatedAt?: string | number
}

export interface CustomerPocketSummary {
  id: string
  name: string
  balance: number
  currency: PocketCurrency | string
  status: 'active' | 'locked'
  createdAt?: string | number
  updatedAt?: string | number
}

export type CustomerSortField =
  | 'phone'
  | 'displayName'
  | 'status'
  | 'createdAt'
  | 'updatedAt'

export interface CustomerFilters {
  page: number
  pageSize: number
  q?: string
  status?: CustomerStatus
  sortBy?: CustomerSortField
  sortOrder?: 'ASC' | 'DESC'
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface CustomerListResult {
  items: Customer[]
  pagination: Pagination
  filters: Partial<CustomerFilters>
  sort: string
}

export interface CustomerDetailResult {
  customer: Customer
  pockets: CustomerPocketSummary[]
}

export interface CustomerStatusResult {
  customer: Customer
  changed: boolean
}
