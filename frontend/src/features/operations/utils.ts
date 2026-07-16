import { appConfig } from '@/config/app-config'

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(appConfig.locale, { dateStyle: 'short', timeStyle: 'medium' }).format(date)
}

export function formatAmount(value: number, currency = appConfig.defaultCurrency): string {
  try {
    return new Intl.NumberFormat(appConfig.locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === appConfig.defaultCurrency ? 0 : 2,
    }).format(value)
  } catch {
    return new Intl.NumberFormat(appConfig.locale).format(value)
  }
}

export function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

export function optionalNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    success: 'Thành công', completed: 'Hoàn tất', done: 'Hoàn tất', active: 'Đang hoạt động',
    init: 'Khởi tạo', draft: 'Bản nháp', pending: 'Đang xử lý', processing: 'Đang xử lý', requested: 'Đã tiếp nhận',
    failed: 'Thất bại', error: 'Có lỗi', expired: 'Hết hạn', reversed: 'Đã hoàn', cancelled: 'Đã hủy',
  }
  return labels[status.toLowerCase()] ?? status
}

export function statusTone(status: string): string {
  const value = status.toLowerCase()
  if (['success', 'completed', 'done', 'active'].includes(value)) return 'success'
  if (['failed', 'error', 'expired', 'rejected', 'cancelled'].includes(value)) return 'danger'
  if (['init', 'draft', 'pending', 'processing', 'requested'].includes(value)) return 'warning'
  return 'neutral'
}

export function compactPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== '' && value !== undefined)) as T
}
