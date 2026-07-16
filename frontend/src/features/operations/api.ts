import { ApiError, apiPost } from '@/lib/api'
import { mappedErrorMessage } from '@/shared/error-message'
import type {
  CashInPayload,
  LedgerEntry,
  LedgerFilters,
  ListResult,
  Trail,
  TrailFilters,
  Transaction,
  TransactionFilters,
  TriggerResult,
} from './types'

const OFFICER = '/api/v1/officer'

export const operationsApi = {
  trigger: (payload: CashInPayload) =>
    apiPost<TriggerResult>(`${OFFICER}/transactions/trigger`, payload),
  listTrails: (filters: TrailFilters) =>
    apiPost<ListResult<Trail>>(`${OFFICER}/trails/list`, filters),
  trailDetail: (trailId: string) =>
    apiPost<{ trail: Trail }>(`${OFFICER}/trails/detail`, { id: trailId }),
  listTransactions: (filters: TransactionFilters) =>
    apiPost<ListResult<Transaction>>(`${OFFICER}/transactions/list`, filters),
  transactionDetail: (transactionId: string) =>
    apiPost<{ transaction: Transaction }>(`${OFFICER}/transactions/detail`, { transactionId }),
  listLedgerEntries: (filters: LedgerFilters) =>
    apiPost<ListResult<LedgerEntry>>(`${OFFICER}/ledger/entries/list`, filters),
  ledgerEntryDetail: (entryId: string) =>
    apiPost<{ entry: LedgerEntry }>(`${OFFICER}/ledger/entries/detail`, { entryId }),
}

const FRIENDLY_ERRORS: Record<string, string> = {
  TRANSACTION_NOT_FOUND: 'Không tìm thấy giao dịch.',
  TRANSACTION_TRAIL_NOT_FOUND: 'Không tìm thấy nhật ký giao dịch.',
  LEDGER_ENTRY_NOT_FOUND: 'Không tìm thấy bút toán.',
  SERVICE_NOT_FOUND: 'Không tìm thấy dịch vụ đã chọn.',
  SERVICE_NOT_ACTIVE: 'Dịch vụ chưa được xuất bản hoặc đã ngừng hoạt động.',
  TRANSACTION_TRAIL_IDENTIFIER_REQUIRED: 'Thiếu mã nhật ký giao dịch.',
  TRANSACTION_IDENTIFIER_REQUIRED: 'Thiếu mã giao dịch.',
  LEDGER_ENTRY_IDENTIFIER_REQUIRED: 'Thiếu mã bút toán.',
}

export function operationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
  return mappedErrorMessage(error, FRIENDLY_ERRORS, error.message)
}
