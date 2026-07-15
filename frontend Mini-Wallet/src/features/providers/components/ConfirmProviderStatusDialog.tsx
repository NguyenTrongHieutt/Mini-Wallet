import type { Provider } from '../types'

interface Props {
  provider: Provider
  open: boolean
  pending?: boolean
  error?: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmProviderStatusDialog({
  provider,
  open,
  pending,
  error,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null
  const activating = provider.status === 'inactive'

  return (
    <div className="provider-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        aria-labelledby="provider-status-title"
        aria-modal="true"
        className="provider-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className={`provider-dialog__icon provider-dialog__icon--${activating ? 'activate' : 'deactivate'}`} aria-hidden="true">
          {activating ? '✓' : 'ǃ'}
        </div>
        <h2 id="provider-status-title">
          {activating ? 'Kích hoạt Provider?' : 'Ngừng hoạt động Provider?'}
        </h2>
        <p>
          {activating
            ? `${provider.name} sẽ có thể được các dịch vụ sử dụng trở lại.`
            : `${provider.name} sẽ không còn được chọn cho các giao dịch mới.`}
        </p>
        {error && <div className="provider-alert provider-alert--error">{error}</div>}
        <div className="provider-dialog__actions">
          <button className="provider-button provider-button--secondary" disabled={pending} onClick={onCancel} type="button">
            Hủy
          </button>
          <button
            className={`provider-button ${activating ? '' : 'provider-button--danger'}`}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? 'Đang xử lý…' : activating ? 'Kích hoạt' : 'Ngừng hoạt động'}
          </button>
        </div>
      </section>
    </div>
  )
}

