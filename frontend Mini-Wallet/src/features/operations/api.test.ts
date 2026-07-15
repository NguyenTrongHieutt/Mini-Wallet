import { afterEach, describe, expect, it, vi } from 'vitest'
import { operationsApi } from './api'
import type { CashInPayload } from './types'

afterEach(() => vi.restoreAllMocks())

describe('operationsApi.trigger cash-in', () => {
  it('sends exactly the five cash-in body fields', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      err: 200,
      message: 'TRANSACTION_TRIGGERED',
      data: { transRefId: 'trail-1', preview: {}, confirmation: {}, receipt: {} },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const payload: CashInPayload = {
      serviceCode: 'CASH_IN',
      customerPhone: '*{{customerPhone}}*',
      amount: 50000,
      currency: 'VND',
      message: 'Postman local cash-in',
    }

    await operationsApi.trigger(payload)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/officer/transactions/trigger', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(payload),
    }))
    expect(Object.keys(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as object)).toEqual([
      'serviceCode',
      'customerPhone',
      'amount',
      'currency',
      'message',
    ])
  })
})
