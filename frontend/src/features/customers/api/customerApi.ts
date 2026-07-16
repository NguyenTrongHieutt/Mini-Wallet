import { apiPost } from '@/lib/api'
import { mappedErrorMessage } from '@/shared/error-message'
import type {
  CustomerDetailResult,
  CustomerFilters,
  CustomerListResult,
  CustomerStatusResult,
} from '../types'

const ROOT = '/api/v1/officer/customers'

export const customerApi = {
  list: (filters: CustomerFilters) =>
    apiPost<CustomerListResult>(`${ROOT}/list`, filters),
  detail: (customerId: string) =>
    apiPost<CustomerDetailResult>(`${ROOT}/detail`, { customerId }),
  lock: (customerId: string) =>
    apiPost<CustomerStatusResult>(`${ROOT}/lock`, { customerId }),
  unlock: (customerId: string) =>
    apiPost<CustomerStatusResult>(`${ROOT}/unlock`, { customerId }),
}

const ERROR_MESSAGES: Record<string, string> = {
  CUSTOMER_NOT_FOUND: 'Không tìm thấy khách hàng hoặc khách hàng đã thay đổi.',
  CUSTOMER_IDENTIFIER_REQUIRED: 'Thiếu thông tin nhận diện khách hàng.',
  CUSTOMER_STATUS_INVALID: 'Trạng thái khách hàng không hợp lệ.',
  CUSTOMER_LOCK_FAILED: 'Không thể khóa khách hàng ở trạng thái hiện tại.',
  CUSTOMER_UNLOCK_FAILED: 'Không thể mở khóa khách hàng ở trạng thái hiện tại.',
}

export function customerErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return mappedErrorMessage(error, ERROR_MESSAGES, error.message)
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}
