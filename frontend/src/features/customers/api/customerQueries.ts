import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerApi } from './customerApi'
import type { CustomerFilters, CustomerStatus } from '../types'

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (customerId: string) => [...customerKeys.details(), customerId] as const,
}

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customerApi.list(filters),
    placeholderData: (previous) => previous,
  })
}

export function useCustomer(customerId?: string) {
  return useQuery({
    queryKey: customerKeys.detail(customerId ?? ''),
    queryFn: () => customerApi.detail(customerId as string),
    enabled: Boolean(customerId),
  })
}

export function useChangeCustomerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ customerId, status }: { customerId: string; status: CustomerStatus }) =>
      status === 'active' ? customerApi.unlock(customerId) : customerApi.lock(customerId),
    onSuccess: (result) => {
      queryClient.setQueryData(
        customerKeys.detail(result.customer.id),
        (current: { customer: typeof result.customer; pockets: unknown[] } | undefined) =>
          current ? { ...current, customer: result.customer } : current,
      )
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}
