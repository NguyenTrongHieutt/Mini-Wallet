import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { providerApi } from './providerApi'

afterEach(() => vi.restoreAllMocks())

describe('providerApi', () => {
  it('gửi cookie và đúng payload khi lấy danh sách', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      err: 200,
      message: 'Officer providers listed',
      data: { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }, filters: {}, sort: 'createdAt DESC' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await providerApi.list({ page: 1, pageSize: 20, status: 'active' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/officer/providers/list', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ page: 1, pageSize: 20, status: 'active' }),
    }))
  })

  it('coi err trong envelope là lỗi dù HTTP status là 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      err: 409,
      message: 'A provider with this service code and provider code already exists',
      data: { providerId: 'provider-1' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    const promise = providerApi.create({
      type: 'utility',
      providerCode: 'EVN_HCM',
      serviceCode: 'BILL_PAYMENT',
      name: 'EVN HCM',
    })

    await expect(promise).rejects.toMatchObject({ code: 409, data: { providerId: 'provider-1' } } satisfies Partial<ApiError>)
  })
})
