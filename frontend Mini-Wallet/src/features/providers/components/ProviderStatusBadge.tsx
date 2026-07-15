import type { ProviderStatus } from '../types'

export function ProviderStatusBadge({ status }: { status: ProviderStatus }) {
  return (
    <span className={`provider-status provider-status--${status}`}>
      <span aria-hidden="true" className="provider-status__dot" />
      {status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
    </span>
  )
}

