import { ApiError, apiPost } from "@/lib/api";
import type {
  CustomerTransactionDetailData,
  CustomerTransactionListData,
  CustomerTransactionListRequest,
} from "./types";

export const customerHistoryApi = {
  list: (request: CustomerTransactionListRequest) =>
    apiPost<CustomerTransactionListData>("/api/v1/customer/transactions/list", request),
  detail: (transactionId: string) =>
    apiPost<CustomerTransactionDetailData>("/api/v1/customer/transactions/detail", {
      id: transactionId,
    }),
};

export function customerHistoryErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  const messages: Record<string, string> = {
    TRANSACTION_NOT_FOUND: "Không tìm thấy giao dịch này.",
    TRANSACTION_IDENTIFIER_REQUIRED: "Thiếu mã giao dịch cần tra cứu.",
    CUSTOMER_TRANSACTIONS_LIST_FAILED: "Không thể tải lịch sử giao dịch.",
    CUSTOMER_TRANSACTION_DETAIL_FAILED: "Không thể tải chi tiết giao dịch.",
  };
  return messages[error.message] ?? error.message;
}

