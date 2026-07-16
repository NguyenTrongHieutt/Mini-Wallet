import type { CustomerCurrency } from "@/customer/types";
import type { CustomerServicePagination, PublicCustomerService } from "@/customer/services/types";

export type CustomerTransactionDirection = "sent" | "received";
export type CustomerTransactionStatus = "done" | "failed" | string;
export type CustomerTransactionSortField =
  | "createdAt"
  | "amount"
  | "totalAmount"
  | "status"
  | "code";
export type CustomerTransactionSortOrder = "ASC" | "DESC";

export interface CustomerTransactionListRequest {
  page: number;
  pageSize: number;
  q?: string;
  direction?: CustomerTransactionDirection;
  status?: CustomerTransactionStatus;
  serviceCode?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  totalAmountFrom?: number;
  totalAmountTo?: number;
  sortBy: CustomerTransactionSortField;
  sortOrder: CustomerTransactionSortOrder;
}

export interface CustomerTransactionListItem {
  id: string;
  code: string;
  transRefId: string;
  direction: CustomerTransactionDirection;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  message?: string | null;
  status: CustomerTransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTransactionListData {
  items: CustomerTransactionListItem[];
  pagination: CustomerServicePagination;
  filters?: Record<string, unknown>;
  sort?: string;
}

export interface CustomerTransactionParty {
  type?: "customer" | "provider" | string;
  phone?: string;
  displayName?: string;
  code?: string;
  name?: string;
  category?: string;
  status?: string;
}

export interface CustomerTransactionDetail extends Omit<CustomerTransactionListItem, "currency"> {
  service: Pick<PublicCustomerService, "code" | "name">;
  sender?: CustomerTransactionParty | null;
  receiver?: CustomerTransactionParty | null;
  currency: CustomerCurrency;
}

export interface CustomerTransactionTrail {
  id: string;
  status?: string;
  expiredAt?: string;
  outputMessage?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerPocketEntry {
  id: string;
  stepOrder?: number;
  debitPocketId?: string;
  creditPocketId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerTransactionDetailData {
  transaction: CustomerTransactionDetail;
  trail?: CustomerTransactionTrail | null;
  entries?: CustomerPocketEntry[];
}

