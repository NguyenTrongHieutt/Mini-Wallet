import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerKeys } from '@/features/customers/api/customerQueries'
import { pocketApi } from './pocketApi'
import type { CreatePocketInput, PocketFilters, PocketStatus } from '../types'

export const pocketKeys = {
  all: ['pockets'] as const,
  lists: () => [...pocketKeys.all, 'list'] as const,
  list: (filters: PocketFilters) => [...pocketKeys.lists(), filters] as const,
  details: () => [...pocketKeys.all, 'detail'] as const,
  detail: (pocketId: string) => [...pocketKeys.details(), pocketId] as const,
}

export function usePockets(filters: PocketFilters) {
  return useQuery({
    queryKey: pocketKeys.list(filters),
    queryFn: () => pocketApi.list(filters),
    placeholderData: (previous) => previous,
  })
}

export function usePocket(pocketId?: string) {
  return useQuery({
    queryKey: pocketKeys.detail(pocketId ?? ''),
    queryFn: () => pocketApi.detail(pocketId as string),
    enabled: Boolean(pocketId),
    select: (result) => result.pocket,
  })
}

export function useCreatePocket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePocketInput) => pocketApi.create(input),
    onSuccess: (result) => {
      queryClient.setQueryData(pocketKeys.detail(result.pocket.id), result)
      void queryClient.invalidateQueries({ queryKey: pocketKeys.lists() })
    },
  })
}

export function useChangePocketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pocketId, status }: { pocketId: string; status: PocketStatus }) =>
      status === 'active' ? pocketApi.unlock(pocketId) : pocketApi.lock(pocketId),
    onSuccess: (result) => {
      queryClient.setQueryData(pocketKeys.detail(result.pocket.id), result)
      void queryClient.invalidateQueries({ queryKey: pocketKeys.lists() })
      // Customer detail embeds pocket summaries.
      void queryClient.invalidateQueries({ queryKey: customerKeys.details() })
    },
  })
}
