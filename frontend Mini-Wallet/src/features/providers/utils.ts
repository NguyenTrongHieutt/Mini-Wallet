import type { ProviderCurrency } from './types'

export function formatDate(value?: string | number): string {
  if (value === undefined || value === null || value === '') return '—'
  const date = typeof value === 'number' && value < 10_000_000_000
    ? new Date(value * 1000)
    : new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function currencyCode(currency: ProviderCurrency | string): string {
  return typeof currency === 'string' ? currency : currency.code
}

export function formatBalance(balance: number, currency: ProviderCurrency | string): string {
  const code = currencyCode(currency)
  const minorUnit = typeof currency === 'string' ? 0 : (currency.minorUnit ?? 0)
  const amount = balance / 10 ** minorUnit
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: minorUnit,
      maximumFractionDigits: minorUnit,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString('vi-VN')} ${code}`
  }
}

export function compactFilters<T extends Record<string, unknown>>(filters: T): T {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined),
  ) as T
}

