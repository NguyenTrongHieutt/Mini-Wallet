import { ApiError, apiPost } from "@/lib/api";
import type { CustomerServiceListData, CustomerServiceListRequest } from "./types";

const CUSTOMER_SERVICES_ROOT = "/api/v1/customer/services";

export const customerServiceApi = {
  list: (request: CustomerServiceListRequest) =>
    apiPost<CustomerServiceListData>(`${CUSTOMER_SERVICES_ROOT}/list`, request),
};

export function customerServiceErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Đã có lỗi xảy ra khi tải dịch vụ. Vui lòng thử lại.";
  }
  return error.message || "Không thể tải danh sách dịch vụ.";
}
