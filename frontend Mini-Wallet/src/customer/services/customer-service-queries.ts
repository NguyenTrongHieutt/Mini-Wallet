import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { customerServiceApi } from "./customer-service-api";
import type { CustomerServiceListRequest } from "./types";

export const customerServiceKeys = {
  all: ["customer-portal", "services"] as const,
  lists: () => [...customerServiceKeys.all, "list"] as const,
  list: (request: CustomerServiceListRequest) => [...customerServiceKeys.lists(), request] as const,
};

export function useCustomerServices(request: CustomerServiceListRequest) {
  return useQuery({
    queryKey: customerServiceKeys.list(request),
    queryFn: () => customerServiceApi.list(request),
    placeholderData: keepPreviousData,
  });
}
