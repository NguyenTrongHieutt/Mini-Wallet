import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { customerHistoryApi } from "./customer-history-api";
import type { CustomerTransactionListRequest } from "./types";

export const customerHistoryKeys = {
  all: ["customer-portal", "transactions"] as const,
  lists: () => [...customerHistoryKeys.all, "list"] as const,
  list: (request: CustomerTransactionListRequest) =>
    [...customerHistoryKeys.lists(), request] as const,
  details: () => [...customerHistoryKeys.all, "detail"] as const,
  detail: (transactionId: string) =>
    [...customerHistoryKeys.details(), transactionId] as const,
};

export function useCustomerTransactionHistory(request: CustomerTransactionListRequest) {
  return useQuery({
    queryKey: customerHistoryKeys.list(request),
    queryFn: () => customerHistoryApi.list(request),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerTransactionDetail(transactionId: string) {
  return useQuery({
    queryKey: customerHistoryKeys.detail(transactionId),
    queryFn: () => customerHistoryApi.detail(transactionId),
    enabled: Boolean(transactionId),
  });
}

