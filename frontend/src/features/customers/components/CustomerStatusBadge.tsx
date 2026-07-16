import { LockKeyhole, ShieldCheck } from 'lucide-react'
import type { CustomerStatus } from '../types'

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return status === 'active' ? (
    <span className="ops-badge ops-badge--success">
      <ShieldCheck size={14} aria-hidden="true" /> Hoạt động
    </span>
  ) : (
    <span className="ops-badge ops-badge--danger">
      <LockKeyhole size={14} aria-hidden="true" /> Đã khóa
    </span>
  )
}
