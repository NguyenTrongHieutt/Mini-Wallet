import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providerApi } from './providerApi'
import type { CreateProviderInput, ProviderFilters, UpdateProviderInput } from '../types'

export const providerKeys = {
  all: ['providers'] as const,
  lists: () => providerKeys.all,
  list: (filters: ProviderFilters) => [...providerKeys.all, filters] as const,
  details: () => ['provider'] as const,
  detail: (id: string) => [...providerKeys.details(), id] as const,
}

export function useProviders(filters: ProviderFilters) {
  return useQuery({
    queryKey: providerKeys.list(filters),
    queryFn: () => providerApi.list(filters),
    placeholderData: (previous) => previous,
  })
}

export function useProvider(providerId?: string) {
  return useQuery({
    queryKey: providerKeys.detail(providerId ?? ''),
    queryFn: () => providerApi.detail(providerId as string),
    enabled: Boolean(providerId),
    select: (result) => result.provider,
  })
}

export function useCreateProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProviderInput) => providerApi.create(input),
    onSuccess: (result) => {
      queryClient.setQueryData(providerKeys.detail(result.provider.id), result)
      void queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
    },
  })
}

export function useUpdateProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProviderInput) => providerApi.update(input),
    onSuccess: (result) => {
      queryClient.setQueryData(providerKeys.detail(result.provider.id), result)
      void queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
    },
  })
}

export function useChangeProviderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ providerId, status }: { providerId: string; status: 'active' | 'inactive' }) =>
      status === 'active'
        ? providerApi.activate(providerId)
        : providerApi.deactivate(providerId),
    onSuccess: (result) => {
      queryClient.setQueryData(providerKeys.detail(result.provider.id), result)
      void queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
    },
  })
}
