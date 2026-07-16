import { apiPost } from '@/lib/api'
import { mappedErrorMessage } from '@/shared/error-message'
import type {
  CreatePocketInput,
  PocketFilters,
  PocketListResult,
  PocketResult,
} from '../types'

const ROOT = '/api/v1/officer/pockets'

export const pocketApi = {
  list: (filters: PocketFilters) =>
    apiPost<PocketListResult>(`${ROOT}/list`, filters),
  detail: (pocketId: string) =>
    apiPost<PocketResult>(`${ROOT}/detail`, { pocketId }),
  create: (input: CreatePocketInput) =>
    apiPost<PocketResult>(`${ROOT}/create`, input),
  lock: (pocketId: string) =>
    apiPost<PocketResult>(`${ROOT}/lock`, { pocketId }),
  unlock: (pocketId: string) =>
    apiPost<PocketResult>(`${ROOT}/unlock`, { pocketId }),
}

const ERROR_MESSAGES: Record<string, string> = {
  POCKET_NOT_FOUND: 'Không tìm thấy ví hoặc ví đã thay đổi.',
  POCKET_IDENTIFIER_REQUIRED: 'Thiếu thông tin nhận diện ví.',
  POCKET_ALREADY_EXISTS: 'Chủ sở hữu đã có ví cho loại tiền này.',
  POCKET_OWNER_TYPE_INVALID: 'Cổng Officer chỉ có thể tạo ví Hệ thống hoặc Ngân hàng.',
  POCKET_OWNER_ID_REQUIRED: 'Vui lòng nhập mã chủ sở hữu.',
  POCKET_OWNER_ID_LENGTH_INVALID: 'Mã chủ sở hữu không được dài quá 100 ký tự.',
  POCKET_NAME_REQUIRED: 'Vui lòng nhập tên hiển thị của ví.',
  POCKET_NAME_LENGTH_INVALID: 'Tên ví cần có từ 2 đến 100 ký tự.',
  POCKET_BALANCE_INVALID: 'Số dư ban đầu phải là số nguyên không âm.',
  POCKET_STATUS_INVALID: 'Trạng thái ví không hợp lệ.',
  CURRENCY_FORMAT_INVALID: 'Mã tiền tệ cần gồm đúng 3 chữ cái, ví dụ VND.',
  CURRENCY_NOT_FOUND: 'Không tìm thấy loại tiền tệ đang hoạt động.',
  POCKET_LOCK_FAILED: 'Không thể khóa ví ở trạng thái hiện tại.',
  POCKET_UNLOCK_FAILED: 'Không thể mở khóa ví ở trạng thái hiện tại.',
  POCKET_TRANSACTION_LOCKED:
    'Ví đang được một giao dịch sử dụng. Hãy chờ giao dịch hoàn tất hoặc hết thời gian giữ khóa.',
}

export function pocketErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return mappedErrorMessage(error, ERROR_MESSAGES, error.message)
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}
