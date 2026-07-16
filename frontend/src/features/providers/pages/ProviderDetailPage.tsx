import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useChangeProviderStatus, useProvider } from '../api/providerQueries'
import { providerErrorMessage } from '../api/providerApi'
import { ConfirmProviderStatusDialog } from '../components/ConfirmProviderStatusDialog'
import { ProviderErrorState, ProviderLoading, ProviderPage } from '../components/ProviderPage'
import { ProviderPocketCard } from '../components/ProviderPocketCard'
import { ProviderStatusBadge } from '../components/ProviderStatusBadge'
import { formatDate } from '../utils'

export function ProviderDetailPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const location = useLocation()
  const query = useProvider(providerId)
  const statusMutation = useChangeProviderStatus()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notice, setNotice] = useState((location.state as { notice?: string } | null)?.notice)

  if (query.isPending) return <ProviderPage backTo="/providers" title="Chi tiết Provider"><ProviderLoading /></ProviderPage>
  if (query.isError || !query.data) return <ProviderPage backTo="/providers" title="Chi tiết Provider"><ProviderErrorState message={providerErrorMessage(query.error)} onRetry={() => void query.refetch()} /></ProviderPage>

  const provider = query.data
  async function confirmStatus() {
    const result = await statusMutation.mutateAsync({ providerId: provider.id, status: provider.status === 'active' ? 'inactive' : 'active' })
    setConfirmOpen(false)
    setNotice(result.changed === false ? 'Provider đã ở trạng thái yêu cầu.' : result.provider.status === 'active' ? 'Provider đã được kích hoạt.' : 'Provider đã ngừng hoạt động.')
  }

  return (
    <ProviderPage
      backTo="/providers"
      title={provider.name}
      description={`${provider.serviceCode} / ${provider.code}`}
      actions={<><Link className="provider-button provider-button--secondary" to={`/providers/${provider.id}/edit`}>Chỉnh sửa</Link><button className={`provider-button ${provider.status === 'active' ? 'provider-button--danger-soft' : ''}`} onClick={() => setConfirmOpen(true)} type="button">{provider.status === 'active' ? 'Ngừng hoạt động' : 'Kích hoạt'}</button></>}
    >
      {notice && <div className="provider-alert provider-alert--success" role="status"><span>{notice}</span><button aria-label="Đóng thông báo" onClick={() => setNotice(undefined)} type="button">×</button></div>}
      <div className="provider-detail-grid">
        <section className="provider-card provider-detail-card">
          <div className="provider-detail-card__heading"><div><p className="provider-card__eyebrow">Thông tin chung</p><h2>{provider.code}</h2></div><ProviderStatusBadge status={provider.status} /></div>
          <dl className="provider-details">
            <div><dt>Dịch vụ</dt><dd><span className="provider-code">{provider.serviceCode}</span></dd></div>
            <div><dt>Loại Provider</dt><dd>{provider.type}</dd></div>
            <div><dt>Danh mục</dt><dd>{provider.category || 'Chưa phân loại'}</dd></div>
            <div><dt>Cập nhật lần cuối</dt><dd>{formatDate(provider.updatedAt)}</dd></div>
            <div><dt>Người cập nhật</dt><dd>{provider.updatedBy || '—'}</dd></div>
          </dl>
        </section>
        <ProviderPocketCard pocket={provider.pocket} />
      </div>
      <section className="provider-card provider-endpoints">
        <div><p className="provider-card__eyebrow">Kết nối</p><h2>Địa chỉ tích hợp</h2><p>Các Action của Service có thể tham chiếu các địa chỉ này.</p></div>
        <Endpoint label="Gửi yêu cầu" value={provider.requestUrl} />
        <Endpoint label="Xác nhận" value={provider.confirmUrl} />
        <Endpoint label="Kiểm tra" value={provider.verifyUrl} />
      </section>
      <ConfirmProviderStatusDialog error={statusMutation.isError ? providerErrorMessage(statusMutation.error) : undefined} onCancel={() => { setConfirmOpen(false); statusMutation.reset() }} onConfirm={() => void confirmStatus()} open={confirmOpen} pending={statusMutation.isPending} provider={provider} />
    </ProviderPage>
  )
}

function Endpoint({ label, value }: { label: string; value: string | null }) {
  return <div className="provider-endpoint"><span>{label}</span>{value ? <a href={value} rel="noreferrer" target="_blank">{value}<span aria-hidden="true"> ↗</span></a> : <em>Chưa cấu hình</em>}</div>
}

