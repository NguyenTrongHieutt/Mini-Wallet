export type CustomerServiceSortField = "code" | "name" | "createdAt";
export type CustomerServiceSortOrder = "ASC" | "DESC";

export interface PublicCustomerService {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
}

export interface CustomerServiceListRequest {
  page: number;
  pageSize: number;
  q?: string;
  code?: string;
  sortBy: CustomerServiceSortField;
  sortOrder: CustomerServiceSortOrder;
}

export interface CustomerServicePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CustomerServiceListData {
  items: PublicCustomerService[];
  pagination: CustomerServicePagination;
  filters?: { code?: string; q?: string };
  sort?: string;
}
