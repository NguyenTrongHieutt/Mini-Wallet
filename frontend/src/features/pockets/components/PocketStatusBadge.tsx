import { Clock3, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { PocketLock, PocketStatus } from '../types'

interface PocketStatusBadgeProps {
  status: PocketStatus
  lock?: PocketLock | null
}

export function PocketStatusBadge({ status, lock }: PocketStatusBadgeProps) {
  if (status === 'active') {
    return (
      <span className="ops-badge ops-badge--success">
        <ShieldCheck size={14} aria-hidden="true" /> Hoạt động
      </span>
    )
  }

  const transaction = lock?.type === 'transaction'
  const officer = lock?.type === 'officer'
  return (
    <span className={`ops-badge ${transaction ? 'ops-badge--warning' : 'ops-badge--danger'}`}>
      {transaction ? <Clock3 size={14} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}
      {transaction ? 'Giao dịch đang giữ' : officer ? 'Officer đã khóa' : 'Đã khóa'}
    </span>
  )
}
