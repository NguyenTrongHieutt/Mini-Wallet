import type { RouteObject } from 'react-router-dom'
import { ProviderCreatePage } from './pages/ProviderCreatePage'
import { ProviderDetailPage } from './pages/ProviderDetailPage'
import { ProviderEditPage } from './pages/ProviderEditPage'
import { ProviderListPage } from './pages/ProviderListPage'

/** Mount these as children of the protected Officer application route. */
export const providerRoutes: RouteObject[] = [
  { path: 'providers', element: <ProviderListPage /> },
  { path: 'providers/new', element: <ProviderCreatePage /> },
  { path: 'providers/:providerId', element: <ProviderDetailPage /> },
  { path: 'providers/:providerId/edit', element: <ProviderEditPage /> },
]

