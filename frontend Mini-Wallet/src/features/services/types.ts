export type ServiceStatus = 'draft' | 'active' | 'inactive'

export type FeeConfig = {
  type: 'fixed' | 'percent'
  value: number
  min?: number
  max?: number
}

export type FieldBuilderItem = {
  order: number
  name: string
  role: string
  rule: 'fixed' | 'mapping' | 'query'
  source: 'constant' | 'body' | 'user' | 'database'
  variable?: string
  value?: unknown
  query?: string
  params?: Array<string | { source: 'constant'; value: unknown } | { source: 'field'; name: string }>
  output?: string
  datatype: 'string' | 'number' | 'boolean' | 'object'
  errorCode: string
  [key: string]: unknown
}

export type ProviderResolver = {
  codeSource: 'FIXED' | 'TRANSBODY'
  codeValue?: string
  codeField?: string
  [key: string]: unknown
}

export type ActionPhase = {
  enabled: boolean
  urlField?: string
  method?: string
  timeoutMs?: number
  requestMap?: Record<string, string>
  responseMap?: Record<string, string>
  successRule?: { field: string; equals?: unknown; notEquals?: unknown; in?: unknown[] }
  errorCode?: string
  [key: string]: unknown
}

export type ServiceActions = {
  provider?: ProviderResolver
  request?: ActionPhase
  confirm?: ActionPhase
  verify?: ActionPhase
  [key: string]: unknown
}

export type Service = {
  id: string
  code: string
  name: string
  description: string
  fieldBuilder: FieldBuilderItem[]
  actions: ServiceActions
  fee: FeeConfig
  auth: { method: 'NONE' | 'PIN'; [key: string]: unknown }
  status: ServiceStatus
  createdAt?: string
  updatedAt?: string
}

export type TransField = {
  id: string
  serviceId: string
  fieldName: string
  fieldFormat: string
  minLength?: number | null
  maxLength?: number | null
  regex?: string | null
  isRequired: boolean
  needSecured: boolean
  order: number
  errorCode?: string | null
  status: 'active' | 'inactive'
}

export type TransValidation = {
  id: string
  serviceId: string
  validateFunc: string
  validateFields: string
  order: number
  errorCode?: string | null
  status: 'active' | 'inactive'
}

export type LedgerTarget = { level: 'productLevel' | 'wallet'; target: string }
export type GlStep = { order: number; amount: string; debit: LedgerTarget; credit: LedgerTarget }
export type TransDefinition = {
  id: string
  serviceId: string
  code: string
  glSteps: GlStep[]
  status: 'active' | 'inactive'
}

export type Pagination = { page: number; pageSize: number; total: number; totalPages: number }

