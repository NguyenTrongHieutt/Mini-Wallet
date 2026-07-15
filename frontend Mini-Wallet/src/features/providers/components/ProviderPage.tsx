import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import '../providers.css'

interface ProviderPageProps {
  title: string
  description?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
  children: ReactNode
}

export function ProviderPage({
  title,
  description,
  backTo,
  backLabel = 'Quay lại',
  actions,
  children,
}: ProviderPageProps) {
  return (
    <main className="provider-page">
      {backTo && (
        <Link className="provider-back" to={backTo}>
          <span aria-hidden="true">←</span> {backLabel}
        </Link>
      )}
      <header className="provider-page__header">
        <div>
          <p className="provider-eyebrow">Quản lý Provider</p>
          <h1>{title}</h1>
          {description && <p className="provider-page__description">{description}</p>}
        </div>
        {actions && <div className="provider-page__actions">{actions}</div>}
      </header>
      {children}
    </main>
  )
}

export function ProviderLoading({ label = 'Đang tải dữ liệu…' }: { label?: string }) {
  return (
    <div className="provider-state" role="status">
      <span className="provider-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function ProviderErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="provider-state provider-state--error" role="alert">
      <strong>Chưa thể tải dữ liệu</strong>
      <p>{message}</p>
      {onRetry && (
        <button className="provider-button provider-button--secondary" onClick={onRetry} type="button">
          Thử lại
        </button>
      )}
    </div>
  )
}

