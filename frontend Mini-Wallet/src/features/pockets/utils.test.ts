import { describe, expect, it } from 'vitest'
import { currencyCode, isTransactionLocked, OWNER_LABELS } from './utils'

describe('pocket presentation helpers', () => {
  it('only marks an active transaction lock as non-actionable by Officer', () => {
    expect(isTransactionLocked({ status: 'locked', lock: { type: 'transaction' } })).toBe(true)
    expect(isTransactionLocked({ status: 'locked', lock: { type: 'officer' } })).toBe(false)
    expect(isTransactionLocked({ status: 'active', lock: { type: 'transaction' } })).toBe(false)
  })

  it('normalizes populated and plain currency values', () => {
    expect(currencyCode('VND')).toBe('VND')
    expect(currencyCode({ code: 'USD', name: 'US Dollar' })).toBe('USD')
  })

  it('provides a friendly label for every backend owner type', () => {
    expect(Object.keys(OWNER_LABELS)).toEqual(['customer', 'provider', 'system', 'bank'])
  })
})
