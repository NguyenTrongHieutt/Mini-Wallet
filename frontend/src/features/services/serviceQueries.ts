export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (serviceId: string) => [...serviceKeys.details(), serviceId] as const,
  fields: (serviceId: string) => [...serviceKeys.detail(serviceId), 'fields'] as const,
  validations: (serviceId: string) => [...serviceKeys.detail(serviceId), 'validations'] as const,
  definition: (serviceId: string) => [...serviceKeys.detail(serviceId), 'definition'] as const,
}
