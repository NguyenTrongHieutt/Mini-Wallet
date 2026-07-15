export type PocketOwnerType = 'customer' | 'provider' | 'system' | 'bank'
export type CreatablePocketOwnerType = Extract<PocketOwnerType, 'system' | 'bank'>
export type PocketStatus = 'active' | 'locked'
export type PocketLockType = 'officer' | 'transaction'

export interface PocketCurrency {
  code: string
  name?: string
  minorUnit?: number
}

export interface PocketLock {
  type: PocketLockType
  lockedAt?: string | number | null
  lockExpiredAt?: string | number | null
}

export interface Pocket {
  id: string
  ownerType: PocketOwnerType
  ownerId: string
  name: string
  balance: number
  currency: PocketCurrency | string
  status: PocketStatus
  lock: PocketLock | null
  createdBy?: string
  updatedBy?: string
  createdAt?: string | number
  updatedAt?: string | number
}

export type PocketSortField =
  | 'name'
  | 'ownerType'
  | 'ownerId'
  | 'balance'
  | 'status'
  | 'createdAt'
  | 'updatedAt'

export interface PocketFilters {
  page: number
  pageSize: number
  q?: string
  ownerType?: PocketOwnerType
  status?: PocketStatus
  currency?: string
  sortBy?: PocketSortField
  sortOrder?: 'ASC' | 'DESC'
}

export interface PocketPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PocketListResult {
  items: Pocket[]
  pagination: PocketPagination
  filters: Partial<PocketFilters>
  sort: string
}

export interface PocketResult {
  pocket: Pocket
  changed?: boolean
}

export interface CreatePocketInput {
  ownerType: CreatablePocketOwnerType
  ownerId: string
  name: string
  currency: string
  balance: number
}
