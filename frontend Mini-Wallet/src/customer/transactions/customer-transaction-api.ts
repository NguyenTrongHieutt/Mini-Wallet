import { ApiError, apiPost } from "@/lib/api";
import type {
  ProviderListData,
  ServiceInputFieldsData,
  TransactionConfirmation,
  TransactionPreview,
  TransactionReceipt,
} from "./types";

export const customerTransactionApi = {
  inputFields: (serviceCode: string) =>
    apiPost<ServiceInputFieldsData>("/api/v1/customer/services/input-fields", { serviceCode }),
  providers: (serviceCode: string, q: string, page: number, pageSize = 20) =>
    apiPost<ProviderListData>("/api/v1/customer/providers/list", {
      serviceCode,
      q,
      page,
      pageSize,
      sortBy: "name",
      sortOrder: "ASC",
    }),
  request: (body: Record<string, unknown>) =>
    apiPost<TransactionPreview>("/api/v1/transactions/request", body),
  confirm: (transRefId: string) =>
    apiPost<TransactionConfirmation>("/api/v1/transactions/confirm", { transRefId }),
  verify: (transRefId: string, pin?: string) =>
    apiPost<TransactionReceipt>(
      "/api/v1/transactions/verify",
      pin ? { transRefId, pin } : { transRefId },
    ),
};

export function transactionErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  }

  const messages: Record<string, string> = {
    INVALID_PIN: "Mã PIN không đúng. Vui lòng kiểm tra lại.",
    TRANSACTION_TRAIL_EXPIRED: "Giao dịch đã hết hạn. Vui lòng bắt đầu lại.",
    TRANSACTION_TRAIL_NOT_EDITABLE:
      "Giao dịch đã được xác nhận và không thể chỉnh sửa.",
    TRANSACTION_TRAIL_NOT_DRAFT:
      "Giao dịch không còn ở trạng thái chờ xác nhận.",
    TRANSACTION_TRAIL_SERVICE_MISMATCH:
      "Mã giao dịch không thuộc dịch vụ này.",
    SERVICE_NOT_FOUND: "Dịch vụ không tồn tại hoặc đã ngừng hoạt động.",
  };

  return messages[error.message] ?? error.message;
}
