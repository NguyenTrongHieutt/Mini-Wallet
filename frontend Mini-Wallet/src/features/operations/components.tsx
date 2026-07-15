import type { ReactNode } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Database } from 'lucide-react'
import { operationErrorMessage } from './api'
import { statusLabel, statusTone } from './utils'

export function StatusBadge({ status }: { status: string }) {
  return <span className={`monitor-status monitor-status--${statusTone(status)}`}>{statusLabel(status)}</span>
}

export function Pagination({ page, pageSize, total, totalPages, onChange }: {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onChange: (patch: { page?: number; pageSize?: number }) => void
}) {
  if (!total) return null
  return (
    <div className="monitor-pagination">
      <span>Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} trong {total}</span>
      <label>Số dòng <select value={pageSize} onChange={(event) => onChange({ page: 1, pageSize: Number(event.target.value) })}>{[10, 20, 50, 100].map((size) => <option key={size}>{size}</option>)}</select></label>
      <div className="monitor-pagination__buttons">
        <button type="button" disabled={page <= 1} onClick={() => onChange({ page: page - 1 })} aria-label="Trang trước"><ChevronLeft size={18} /></button>
        <strong>{page}/{Math.max(totalPages, 1)}</strong>
        <button type="button" disabled={page >= totalPages} onClick={() => onChange({ page: page + 1 })} aria-label="Trang sau"><ChevronRight size={18} /></button>
      </div>
    </div>
  )
}

export function QueryState({ loading, error, empty, noun, retry, children }: {
  loading: boolean
  error: unknown
  empty: boolean
  noun: string
  retry: () => void
  children: ReactNode
}) {
  if (loading) return <div className="monitor-state"><span className="monitor-spinner" /><h2>Đang tải {noun}</h2></div>
  if (error) return <div className="monitor-state"><AlertCircle size={34} /><h2>Không tải được {noun}</h2><p>{operationErrorMessage(error)}</p><button className="monitor-button monitor-button--secondary" type="button" onClick={retry}>Thử lại</button></div>
  if (empty) return <div className="monitor-state"><Database size={34} /><h2>Chưa có dữ liệu phù hợp</h2><p>Hãy thay đổi hoặc xóa bớt điều kiện lọc.</p></div>
  return children
}

export function JsonDetails({ value, title = 'Dữ liệu kỹ thuật' }: { value: unknown; title?: string }) {
  return <details className="monitor-json"><summary>{title}</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>
}

export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return <div className="monitor-detail-item"><dt>{label}</dt><dd>{children || '—'}</dd></div>
}
