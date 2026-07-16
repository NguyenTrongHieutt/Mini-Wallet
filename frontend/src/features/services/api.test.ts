import { afterEach, describe, expect, it, vi } from 'vitest'
import { serviceApi } from './api'
import { moveOrderedItem, removeOrderedItem } from './orderUtils'
import type { FieldBuilderItem, GlStep } from './types'

afterEach(() => vi.restoreAllMocks())

function mockSuccess(data: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
    err: 200,
    message: 'OK',
    data,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
}

describe('service ordered configuration API', () => {
  it('sends the normalized fieldBuilder after an item is removed', async () => {
    const fetchMock = mockSuccess({ service: { id: 'service-1', fieldBuilder: [] }, changed: true })
    const fields = [
      { order: 1, name: 'FIRST' },
      { order: 2, name: 'SECOND' },
      { order: 3, name: 'THIRD' },
    ] as FieldBuilderItem[]
    const next = removeOrderedItem(fields, 1)

    await serviceApi.updateFieldBuilder('service-1', next)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/officer/services/field-builder/update', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ serviceId: 'service-1', fieldBuilder: [
        { order: 1, name: 'FIRST' },
        { order: 2, name: 'THIRD' },
      ] }),
    }))
  })

  it('sends the reordered glSteps to the trans-definition API', async () => {
    const fetchMock = mockSuccess({ transDefinition: { id: 'definition-1', glSteps: [] }, changed: true })
    const steps = [
      { order: 1, amount: 'FIRST' },
      { order: 2, amount: 'SECOND' },
      { order: 3, amount: 'THIRD' },
    ] as GlStep[]
    const next = moveOrderedItem(steps, 2, 0)

    await serviceApi.updateDefinition('service-1', next)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/officer/services/trans-definition/update', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ serviceId: 'service-1', glSteps: [
        { order: 1, amount: 'THIRD' },
        { order: 2, amount: 'FIRST' },
        { order: 3, amount: 'SECOND' },
      ], status: 'active' }),
    }))
  })
})
