import { ApiError, apiPost } from '../../lib/api'
import type { FieldBuilderItem, GlStep, Pagination, Service, ServiceActions, TransDefinition, TransField, TransValidation } from './types'

const base = '/api/v1/officer/services'

export const serviceApi = {
  list: (body: Record<string, unknown>) => apiPost<{ items: Service[]; pagination: Pagination }>(`${base}/list`, body),
  detail: (serviceId: string) => apiPost<{ service: Service }>(`${base}/detail`, { serviceId }),
  create: (body: Record<string, unknown>) => apiPost<{ service: Service }>(`${base}/create`, body),
  update: (serviceId: string, body: Record<string, unknown>) => apiPost<{ service: Service; changed: boolean }>(`${base}/update`, { serviceId, ...body }),
  updateFieldBuilder: (serviceId: string, fieldBuilder: FieldBuilderItem[]) => apiPost<{ service: Service; changed: boolean }>(`${base}/field-builder/update`, { serviceId, fieldBuilder }),
  listFields: (serviceId: string) => apiPost<{ items: TransField[]; total: number }>(`${base}/trans-fields/list`, { serviceId }),
  insertField: (serviceId: string, body: Record<string, unknown>) => apiPost<{ transField: TransField }>(`${base}/trans-fields/insert`, { serviceId, ...body }),
  updateField: (serviceId: string, transFieldId: string, body: Record<string, unknown>) => apiPost<{ transField: TransField; changed: boolean }>(`${base}/trans-fields/update`, { serviceId, transFieldId, ...body }),
  listValidations: (serviceId: string) => apiPost<{ items: TransValidation[]; total: number }>(`${base}/trans-validations/list`, { serviceId }),
  insertValidation: (serviceId: string, body: Record<string, unknown>) => apiPost<{ transValidation: TransValidation }>(`${base}/trans-validations/insert`, { serviceId, ...body }),
  updateValidation: (serviceId: string, transValidationId: string, body: Record<string, unknown>) => apiPost<{ transValidation: TransValidation; changed: boolean }>(`${base}/trans-validations/update`, { serviceId, transValidationId, ...body }),
  updateActions: (serviceId: string, actions: ServiceActions) => apiPost<{ service: Service; changed: boolean }>(`${base}/actions/update`, { serviceId, actions }),
  definition: (serviceId: string) => apiPost<{ transDefinition: TransDefinition }>(`${base}/trans-definition/detail`, { serviceId }),
  updateDefinition: (serviceId: string, glSteps: GlStep[], status = 'active') => apiPost<{ transDefinition: TransDefinition; created: boolean; changed: boolean }>(`${base}/trans-definition/update`, { serviceId, glSteps, status }),
  publish: (serviceId: string) => apiPost<{ service: Service; changed: boolean }>(`${base}/publish`, { serviceId }),
  unpublish: (serviceId: string) => apiPost<{ service: Service; changed: boolean }>(`${base}/unpublish`, { serviceId }),
}

const errorMessages: Record<string, string> = {
  SERVICE_ALREADY_EXISTS: 'Mã dịch vụ này đã tồn tại.',
  SERVICE_NOT_FOUND: 'Không tìm thấy dịch vụ hoặc dịch vụ đã thay đổi.',
  SERVICE_CODE_REQUIRED: 'Hãy nhập mã dịch vụ.',
  SERVICE_CODE_INVALID: 'Mã dịch vụ chỉ gồm chữ in hoa, số, gạch dưới hoặc gạch ngang.',
  SERVICE_NAME_REQUIRED: 'Hãy nhập tên dịch vụ.',
  SERVICE_NAME_LENGTH_INVALID: 'Tên dịch vụ phải có từ 2 đến 100 ký tự.',
  SERVICE_DESCRIPTION_LENGTH_INVALID: 'Mô tả không được vượt quá 1.000 ký tự.',
  SERVICE_FEE_INVALID: 'Cấu hình phí chưa hợp lệ. Hãy kiểm tra giá trị tối thiểu và tối đa.',
  SERVICE_AUTH_INVALID: 'Cách xác thực chưa được hỗ trợ.',
  SERVICE_ACTIVE_CONFIG_READ_ONLY: 'Dịch vụ đang hoạt động. Hãy tắt dịch vụ trước khi chỉnh sửa.',
  FIELD_BUILDER_REQUIRED: 'Cần ít nhất một biến giao dịch trước khi tiếp tục.',
  FIELD_BUILDER_INVALID: 'Một biến giao dịch chưa hợp lệ. Hãy kiểm tra tên, nguồn và thứ tự.',
  TRANS_FIELD_ALREADY_EXISTS: 'Trường nhập này đã tồn tại.',
  TRANS_FIELD_INVALID: 'Cấu hình trường nhập chưa hợp lệ.',
  TRANS_FIELD_REGEX_INVALID: 'Biểu thức kiểm tra của trường nhập chưa hợp lệ.',
  TRANS_VALIDATION_ALREADY_EXISTS: 'Quy tắc nghiệp vụ này đã tồn tại.',
  TRANS_VALIDATION_INVALID: 'Quy tắc nghiệp vụ chưa hợp lệ.',
  VALIDATION_CONFIG_INVALID: 'JSON cấu hình validation chưa hợp lệ.',
  TRANS_DEFINITION_NOT_FOUND: 'Chưa có cấu hình định khoản.',
  TRANS_DEFINITION_INVALID: 'Cấu hình định khoản chưa hợp lệ.',
  SERVICE_TRANS_FIELDS_REQUIRED: 'Cần ít nhất một trường nhập đang hoạt động.',
  SERVICE_TRANS_FIELD_UNBUILT: 'Có trường nhập chưa được tạo ở bước Dựng biến.',
  TRANS_DEFINITION_FIELD_UNKNOWN: 'Định khoản đang tham chiếu một biến chưa tồn tại.',
}

export function serviceErrorMessage(error: unknown, fallback = 'Yêu cầu chưa thực hiện được. Vui lòng thử lại.') {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : fallback
  return errorMessages[error.message] ?? error.message ?? fallback
}
