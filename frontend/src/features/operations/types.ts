export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type SortOrder = 'ASC' | 'DESC'

export type CashInPayload = {
  serviceCode: 'CASH_IN'
  customerPhone: string
  amount: number
  currency: string
  message: string
}

export type TrailFilters = {
  page: number
  pageSize: number
  status?: string
  customerId?: string
  officerId?: string
  serviceCode?: string
  dateFrom?: string
  dateTo?: string
  q?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'expiredAt' | 'status'
  sortOrder?: SortOrder
}

export type Trail = {
  id: string
  service: { id: string; code?: string; name?: string }
  customerId: string | null
  officerId: string | null
  status: string
  expiredAt?: string | null
  isExpired: boolean
  errorCode: string | null
  errorMessage: string | null
  outputMessage?: unknown
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export type TransactionFilters = {
  page: number
  pageSize: number
  status?: string
  senderCustomerId?: string
  receiverCustomerId?: string
  receiverProviderId?: string
  transRefId?: string
  serviceCode?: string
  amountFrom?: number
  amountTo?: number
  dateFrom?: string
  dateTo?: string
  q?: string
  sortBy?: 'createdAt' | 'amount' | 'totalAmount' | 'status' | 'code'
  sortOrder?: SortOrder
}

export type Party = {
  type: 'customer' | 'provider'
  phone?: string
  displayName?: string
  code?: string
  name?: string
  category?: string
  status?: string
}

export type Transaction = {
  id: string
  code: string
  transRefId: string
  serviceId?: string
  service?: { id: string; code?: string; name?: string }
  senderCustomerId: string | null
  receiverCustomerId: string | null
  receiverProviderId: string | null
  sender?: Party | null
  receiver?: Party | null
  amount: number
  fee: number
  totalAmount: number
  currencyId?: string
  currency?: { id: string; code?: string; name?: string; minorUnit?: number }
  message?: string | null
  status: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export type LedgerFilters = {
  page: number
  pageSize: number
  transRefId?: string
  status?: string
  pocketId?: string
  direction?: 'debit' | 'credit'
  currency?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'stepOrder' | 'amount' | 'status'
  sortOrder?: SortOrder
}

export type LedgerEntry = {
  id: string
  transRefId: string
  stepOrder: number
  debitPocketId?: string
  creditPocketId?: string
  debitPocket?: PocketReference
  creditPocket?: PocketReference
  amount: number
  currencyId?: string
  currency?: CurrencyReference
  status: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt?: string
}

export type PocketReference = {
  id: string
  name?: string
  ownerType?: string
  ownerId?: string
  currencyId?: string
  balance?: number
  status?: string
  missing?: boolean
  [key: string]: unknown
}

export type CurrencyReference = {
  id: string
  code?: string
  name?: string
  minorUnit?: number
  status?: string
  missing?: boolean
  [key: string]: unknown
}

export type ListResult<T> = {
  items: T[]
  pagination: Pagination
  sort: string
}

export type OperationService = {
  id: string
  code: string
  name: string
  description?: string
  status: string
}

export type OperationField = {
  id: string
  fieldName: string
  fieldFormat: string
  isRequired: boolean
  needSecured: boolean
  minLength?: number | null
  maxLength?: number | null
  regex?: string | null
  order: number
  status: string
}

export type TriggerResult = {
  transRefId: string
  preview: unknown
  confirmation: unknown
  receipt: unknown
}
