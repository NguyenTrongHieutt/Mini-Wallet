import type { CustomerServicePagination, PublicCustomerService } from "@/customer/services/types";

export interface TransactionFieldValidation {
  format?: string;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  needSecured?: boolean;
  errorCode?: string;
}

export interface TransactionInputField {
  name: string;
  transField?: string;
  role?: string;
  dataType?: string;
  required?: boolean;
  defaultValue?: unknown;
  validation?: TransactionFieldValidation | null;
  errorCode?: string;
}

export interface ServiceInputFieldsData {
  service: PublicCustomerService;
  endpoint: { method: string; path: string };
  bodyFields: TransactionInputField[];
  requestExample?: Record<string, unknown>;
}

export interface PublicProvider {
  id: string;
  serviceCode: string;
  type?: string;
  code: string;
  name: string;
  category?: string | null;
  status: string;
}

export interface ProviderListData {
  items: PublicProvider[];
  pagination: CustomerServicePagination;
  filters?: Record<string, unknown>;
  sort?: string;
}

export interface TransactionPreview {
  transRefId: string;
  service: PublicCustomerService;
  amount?: number;
  fee?: number;
  totalAmount?: number;
  currency?: string;
  input?: Record<string, unknown> | null;
  status: string;
  expiredAt?: string;
}

export interface TransactionConfirmation {
  transRefId: string;
  service: PublicCustomerService;
  authMethod: "PIN" | "NONE" | string;
  status: string;
  expiredAt?: string;
}

export interface TransactionReceipt {
  transRefId: string;
  transaction?: { id: string; code?: string; status?: string };
  service: PublicCustomerService;
  amount?: number;
  fee?: number;
  totalAmount?: number;
  message?: string;
  currency?: string;
  status: string;
}
