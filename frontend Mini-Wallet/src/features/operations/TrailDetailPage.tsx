import { AlertCircle, ArrowLeft, Clock, ExternalLink, RefreshCw } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { DetailItem, JsonDetails, StatusBadge } from './components'
import { operationErrorMessage } from './api'
import { useTrail } from './hooks'
import { formatDate } from './utils'
import './operations.css'

export function TrailDetailPage() {
  const { trailId } = useParams<{ trailId: string }>()
  const location = useLocation()
  const query = useTrail(trailId)
  const back = (location.state as { from?: string } | null)?.from ?? '/trails'

  if (query.isLoading) return <main className="monitor-page"><section className="monitor-panel monitor-state"><span className="monitor-spinner" /><h2>Đang tải nhật ký</h2></section></main>
  if (query.isError || !query.data) return <main className="monitor-page"><Link className="monitor-link-button monitor-link-button--secondary" to={back}><ArrowLeft size={17} /> Danh sách Trail</Link><section className="monitor-panel monitor-state" style={{ marginTop: 18 }}><AlertCircle size={34} /><h2>Không mở được nhật ký</h2><p>{operationErrorMessage(query.error)}</p><button className="monitor-button monitor-button--secondary" onClick={() => query.refetch()}>Thử lại</button></section></main>
  const trail = query.data
  return <main className="monitor-page">
    <header className="monitor-header"><div><Link className="monitor-link-button monitor-link-button--secondary" to={back}><ArrowLeft size={17} /> Danh sách Trail</Link><p className="monitor-eyebrow" style={{ marginTop: 18 }}>Chi tiết luồng xử lý</p><h1 className="monitor-title">{trail.service.code ?? 'Transaction Trail'}</h1><p className="monitor-subtitle">{trail.id}</p></div><div className="monitor-header__actions"><StatusBadge status={trail.isExpired ? 'expired' : trail.status} /><button className="monitor-button monitor-button--secondary" onClick={() => query.refetch()}><RefreshCw size={17} /> Làm mới</button></div></header>
    <div className="monitor-detail-layout"><section className="monitor-panel">
      <div className="monitor-section"><h2 className="monitor-section-title"><Clock size={18} /> Tổng quan</h2><dl className="monitor-detail-grid"><DetailItem label="Dịch vụ">{trail.service.name ? `${trail.service.name} (${trail.service.code})` : trail.service.id}</DetailItem><DetailItem label="Trạng thái"><StatusBadge status={trail.isExpired ? 'expired' : trail.status} /></DetailItem><DetailItem label="Khởi tạo lúc">{formatDate(trail.createdAt)}</DetailItem><DetailItem label="Hết hạn lúc">{formatDate(trail.expiredAt)}</DetailItem><DetailItem label="Cập nhật lúc">{formatDate(trail.updatedAt)}</DetailItem><DetailItem label="Officer">{trail.officerId ?? '—'}</DetailItem></dl></div>
      {(trail.errorCode || trail.errorMessage) && <div className="monitor-section"><h2 className="monitor-section-title"><AlertCircle size={18} /> Thông tin lỗi</h2><div className="monitor-alert monitor-alert--error"><div><strong>{trail.errorCode ?? 'Giao dịch có lỗi'}</strong><div>{trail.errorMessage}</div></div></div></div>}
      <JsonDetails title="Output message" value={trail.outputMessage} /><JsonDetails value={trail} />
    </section><aside className="monitor-side-stack">
      <div className="monitor-panel monitor-side-card"><h3>Đối tượng liên quan</h3><p>Khách hàng: {trail.customerId ?? 'Không có'}</p>{trail.customerId && <Link className="monitor-link-button monitor-link-button--secondary" to={`/customers/${trail.customerId}`}>Mở khách hàng <ExternalLink size={15} /></Link>}</div>
      <div className="monitor-panel monitor-side-card"><h3>Tra cứu giao dịch</h3><p>Dùng mã Trail làm tham chiếu để tìm giao dịch và các bút toán phát sinh.</p><Link className="monitor-link-button monitor-link-button--secondary" to={`/transactions?transRefId=${encodeURIComponent(trail.id)}`}>Tìm giao dịch <ExternalLink size={15} /></Link><Link className="monitor-link-button monitor-link-button--secondary" style={{ marginTop: 8 }} to={`/ledger/entries?transRefId=${encodeURIComponent(trail.id)}`}>Tìm bút toán <ExternalLink size={15} /></Link></div>
    </aside></div>
  </main>
}
