import { describe, expect, it } from 'vitest'
import { providerFormSchema } from './ProviderForm'

const validProvider = {
  type: 'utility',
  providerCode: 'EVN_HCM',
  serviceCode: 'BILL_PAYMENT',
  name: 'Điện lực TP. Hồ Chí Minh',
  category: 'electricity',
  requestUrl: 'https://provider.example.com/request',
  confirmUrl: '',
  verifyUrl: '',
  currency: 'VND',
  balance: 0,
  pocketName: '',
}

describe('providerFormSchema', () => {
  it('chấp nhận cấu hình Provider hợp lệ', () => {
    expect(providerFormSchema.safeParse(validProvider).success).toBe(true)
  })

  it('từ chối code chữ thường, URL không phải HTTP và số dư âm', () => {
    const result = providerFormSchema.safeParse({
      ...validProvider,
      providerCode: 'evn hcm',
      requestUrl: 'ftp://provider.example.com',
      balance: -1,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0])
      expect(fields).toEqual(expect.arrayContaining(['providerCode', 'requestUrl', 'balance']))
    }
  })
})

