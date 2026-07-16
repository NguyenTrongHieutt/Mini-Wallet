import { describe, expect, it } from 'vitest'
import { serviceKeys } from './serviceQueries'

describe('serviceKeys', () => {
  it('builds hierarchical list and detail keys', () => {
    const filters = { q: 'cash', status: 'active', page: 2 }

    expect(serviceKeys.list(filters)).toEqual(['services', 'list', filters])
    expect(serviceKeys.detail('service-1')).toEqual(['services', 'detail', 'service-1'])
  })

  it('scopes service configuration keys to the service detail', () => {
    expect(serviceKeys.fields('service-1')).toEqual(['services', 'detail', 'service-1', 'fields'])
    expect(serviceKeys.validations('service-1')).toEqual(['services', 'detail', 'service-1', 'validations'])
    expect(serviceKeys.definition('service-1')).toEqual(['services', 'detail', 'service-1', 'definition'])
  })
})
