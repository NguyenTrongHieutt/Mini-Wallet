import type {
  CreateProviderInput,
  ProviderFilters,
  ProviderListResult,
  ProviderMutationResult,
  UpdateProviderInput,
} from '../types'
import { ApiError, apiPost } from '@/lib/api'
import { mappedErrorMessage } from '@/shared/error-message'

export { ApiError as ProviderApiError }

const ROOT = '/api/v1/officer/providers'

export const providerApi = {
  list: (filters: ProviderFilters) => apiPost<ProviderListResult>(`${ROOT}/list`, filters),
  detail: (providerId: string) =>
    apiPost<ProviderMutationResult>(`${ROOT}/detail`, { providerId }),
  create: (input: CreateProviderInput) =>
    apiPost<ProviderMutationResult>(`${ROOT}/create`, input),
  update: (input: UpdateProviderInput) =>
    apiPost<ProviderMutationResult>(`${ROOT}/update`, input),
  activate: (providerId: string) =>
    apiPost<ProviderMutationResult>(`${ROOT}/activate`, { providerId }),
  deactivate: (providerId: string) =>
    apiPost<ProviderMutationResult>(`${ROOT}/deactivate`, { providerId }),
}

const ERROR_MESSAGES: Record<string, string> = {
  PROVIDER_ALREADY_EXISTS: 'Provider này đã tồn tại trong dịch vụ đã chọn.',
  SERVICE_NOT_FOUND: 'Không tìm thấy dịch vụ. Hãy kiểm tra lại mã dịch vụ.',
  CURRENCY_NOT_FOUND: 'Không tìm thấy loại tiền tệ đã chọn.',
  PROVIDER_NOT_FOUND: 'Không tìm thấy Provider hoặc Provider đã thay đổi.',
  PROVIDER_URL_INVALID: 'Địa chỉ kết nối phải là URL HTTP hoặc HTTPS hợp lệ.',
  PROVIDER_CODE_INVALID: 'Mã Provider chưa đúng định dạng.',
  PROVIDER_SERVICE_CODE_INVALID: 'Mã dịch vụ chưa đúng định dạng.',
  POCKET_BALANCE_INVALID: 'Số dư ban đầu phải là số nguyên không âm.',
  'A provider with this service code and provider code already exists': 'Provider này đã tồn tại trong dịch vụ đã chọn.',
  'Service not found': 'Không tìm thấy dịch vụ. Hãy kiểm tra lại mã dịch vụ.',
  'Currency not found': 'Không tìm thấy loại tiền tệ đã chọn.',
  'Provider not found': 'Không tìm thấy Provider hoặc Provider đã thay đổi.',
  'Provider URL must be a valid HTTP or HTTPS URL': 'Địa chỉ kết nối phải là URL HTTP hoặc HTTPS hợp lệ.',
  'Provider code format is invalid': 'Mã Provider chưa đúng định dạng.',
  'Provider service code format is invalid': 'Mã dịch vụ chưa đúng định dạng.',
  'Pocket balance must be a non-negative safe integer': 'Số dư ban đầu phải là số nguyên không âm.',
}

export function providerErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
  return mappedErrorMessage(error, ERROR_MESSAGES, error.message)
}
