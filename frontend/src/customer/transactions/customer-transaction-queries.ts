import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerKeys } from "@/customer/api/customer-auth-api";
import { customerTransactionApi } from "./customer-transaction-api";

export const customerTransactionKeys = {
  all: ["customer-portal", "transactions"] as const,
  inputFields: (serviceCode: string) =>
    ["customer-portal", "services", "input-fields", serviceCode] as const,
  providers: (serviceCode: string, q: string) =>
    ["customer-portal", "providers", serviceCode, q] as const,
};

export function useServiceInputFields(serviceCode: string) {
  return useQuery({
    queryKey: customerTransactionKeys.inputFields(serviceCode),
    queryFn: () => customerTransactionApi.inputFields(serviceCode),
    enabled: Boolean(serviceCode),
  });
}

export function useProviderSuggestions(serviceCode: string, q: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: customerTransactionKeys.providers(serviceCode, q),
    queryFn: ({ pageParam }) => customerTransactionApi.providers(serviceCode, q, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: enabled && Boolean(serviceCode),
  });
}

export function useTransactionMutations() {
  const queryClient = useQueryClient();
  const requestMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => customerTransactionApi.request(body),
  });
  const confirmMutation = useMutation({
    mutationFn: (transRefId: string) => customerTransactionApi.confirm(transRefId),
  });
  const verifyMutation = useMutation({
    mutationFn: ({ transRefId, pin }: { transRefId: string; pin?: string }) =>
      customerTransactionApi.verify(transRefId, pin),
    onSuccess: (receipt) => {
      void queryClient.invalidateQueries({ queryKey: customerTransactionKeys.all });
      void queryClient.invalidateQueries({
        queryKey: customerKeys.wallet(receipt.currency || "VND"),
      });
    },
  });

  return { requestMutation, confirmMutation, verifyMutation };
}
