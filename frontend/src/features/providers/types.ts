export type ProviderStatus = 'active' | 'inactive'

export interface ProviderCurrency {
  code: string
  name?: string
  minorUnit?: number
}

export interface ProviderPocket {
  id: string
  ownerType: 'provider'
  ownerId: string
  name: string
  balance: number
  currency: ProviderCurrency | string
  status: 'active' | 'locked'
}

export interface Provider {
  id: string
  type: string
  code: string
  serviceCode: string
  name: string
  category: string | null
  requestUrl: string | null
  confirmUrl: string | null
  verifyUrl: string | null
  status: ProviderStatus
  pocketId: string | null
  pocket: ProviderPocket | null
  createdBy?: string
  updatedBy?: string
  createdAt?: string | number
  updatedAt?: string | number
}

export type ProviderSortField =
  | 'code'
  | 'serviceCode'
  | 'name'
  | 'category'
  | 'type'
  | 'status'
  | 'createdAt'
  | 'updatedAt'

export interface ProviderFilters {
  page: number
  pageSize: number
  q?: string
  serviceCode?: string
  providerCode?: string
  type?: string
  category?: string
  status?: ProviderStatus
  sortBy?: ProviderSortField
  sortOrder?: 'ASC' | 'DESC'
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ProviderListResult {
  items: Provider[]
  pagination: Pagination
  filters: Partial<ProviderFilters>
  sort: string
}

export interface CreateProviderInput {
  type: string
  providerCode: string
  serviceCode: string
  name: string
  category?: string
  requestUrl?: string
  confirmUrl?: string
  verifyUrl?: string
  currency?: string
  balance?: number
  pocketName?: string
}

export interface UpdateProviderInput {
  providerId: string
  type?: string
  providerCode?: string
  serviceCode?: string
  name?: string
  category?: string
  requestUrl?: string
  confirmUrl?: string
  verifyUrl?: string
}

export interface ProviderMutationResult {
  provider: Provider
  changed?: boolean
}

