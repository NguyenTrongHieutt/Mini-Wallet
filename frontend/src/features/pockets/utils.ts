import type { Pocket, PocketCurrency, PocketOwnerType } from './types'

export const OWNER_LABELS: Record<PocketOwnerType, string> = {
  customer: 'Khách hàng',
  provider: 'Provider',
  system: 'Hệ thống',
  bank: 'Ngân hàng',
}

export function currencyCode(currency: PocketCurrency | string): string {
  return typeof currency === 'string' ? currency : currency.code
}

export function formatMoney(value: number, currency: PocketCurrency | string): string {
  const code = currencyCode(currency) || 'VND'
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: typeof currency === 'object' ? currency.minorUnit : undefined,
    }).format(value)
  } catch {
    return `${new Intl.NumberFormat('vi-VN').format(value)} ${code}`
  }
}

export function formatDate(value?: string | number | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

export function isTransactionLocked(pocket: Pick<Pocket, 'status' | 'lock'>): boolean {
  return pocket.status === 'locked' && pocket.lock?.type === 'transaction'
}
