import { AlertCircle, ArrowLeft, ExternalLink, ReceiptText, RefreshCw, Users } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { operationErrorMessage } from './api'
import { DetailItem, JsonDetails, StatusBadge } from './components'
import { useTransaction } from './hooks'
import { formatAmount, formatDate } from './utils'
import './operations.css'

export function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const location = useLocation()
  const query = useTransaction(transactionId)
  const back = (location.state as { from?: string } | null)?.from ?? '/transactions'
  if (query.isLoading) return <main className="monitor-page"><section className="monitor-panel monitor-state"><span className="monitor-spinner" /><h2>Đang tải giao dịch</h2></section></main>
  if (query.isError || !query.data) return <main className="monitor-page"><Link className="monitor-link-button monitor-link-button--secondary" to={back}><ArrowLeft size={17} /> Danh sách giao dịch</Link><section className="monitor-panel monitor-state" style={{ marginTop: 18 }}><AlertCircle size={34} /><h2>Không mở được giao dịch</h2><p>{operationErrorMessage(query.error)}</p><button className="monitor-button monitor-button--secondary" onClick={() => query.refetch()}>Thử lại</button></section></main>
  const item = query.data
  const currency = item.currency?.code ?? 'VND'
  return <main className="monitor-page">
    <header className="monitor-header"><div><Link className="monitor-link-button monitor-link-button--secondary" to={back}><ArrowLeft size={17} /> Danh sách giao dịch</Link><p className="monitor-eyebrow" style={{ marginTop: 18 }}>Chi tiết giao dịch</p><h1 className="monitor-title">{item.code}</h1><p className="monitor-subtitle">TransRef ID: {item.transRefId}</p></div><div className="monitor-header__actions"><StatusBadge status={item.status} /><button className="monitor-button monitor-button--secondary" onClick={() => query.refetch()}><RefreshCw size={17} /> Làm mới</button></div></header>
    <div className="monitor-detail-layout"><section className="monitor-panel">
      <div className="monitor-metric"><small>Tổng tiền giao dịch</small><strong>{formatAmount(item.totalAmount, currency)}</strong><small>Giá trị {formatAmount(item.amount, currency)} · Phí {formatAmount(item.fee, currency)}</small></div>
      <div className="monitor-section"><h2 className="monitor-section-title"><ReceiptText size={18} /> Thông tin chung</h2><dl className="monitor-detail-grid"><DetailItem label="Dịch vụ">{item.service?.name ? `${item.service.name} (${item.service.code})` : item.service?.id ?? item.serviceId}</DetailItem><DetailItem label="Tiền tệ">{item.currency?.name ? `${item.currency.name} (${currency})` : currency}</DetailItem><DetailItem label="Trạng thái"><StatusBadge status={item.status} /></DetailItem><DetailItem label="Nội dung">{item.message ?? '—'}</DetailItem><DetailItem label="Khởi tạo lúc">{formatDate(item.createdAt)}</DetailItem><DetailItem label="Cập nhật lúc">{formatDate(item.updatedAt)}</DetailItem></dl></div>
      <div className="monitor-section"><h2 className="monitor-section-title"><Users size={18} /> Các bên giao dịch</h2><dl className="monitor-detail-grid"><DetailItem label="Bên gửi">{item.sender?.displayName ?? item.sender?.phone ?? item.senderCustomerId ?? '—'}</DetailItem><DetailItem label="Bên nhận">{item.receiver?.displayName ?? item.receiver?.name ?? item.receiver?.code ?? item.receiverCustomerId ?? item.receiverProviderId ?? '—'}</DetailItem></dl></div>
      <JsonDetails value={item} />
    </section><aside className="monitor-side-stack">
      <div className="monitor-panel monitor-side-card"><h3>Liên kết nghiệp vụ</h3>{item.senderCustomerId && <Link className="monitor-link-button monitor-link-button--secondary" style={{ width: '100%', marginBottom: 8 }} to={`/customers/${item.senderCustomerId}`}>Khách hàng gửi <ExternalLink size={15} /></Link>}{item.receiverCustomerId && <Link className="monitor-link-button monitor-link-button--secondary" style={{ width: '100%', marginBottom: 8 }} to={`/customers/${item.receiverCustomerId}`}>Khách hàng nhận <ExternalLink size={15} /></Link>}{item.receiverProviderId && <Link className="monitor-link-button monitor-link-button--secondary" style={{ width: '100%' }} to={`/providers/${item.receiverProviderId}`}>Provider nhận <ExternalLink size={15} /></Link>}</div>
      <div className="monitor-panel monitor-side-card"><h3>Đối soát theo tham chiếu</h3><p>{item.transRefId}</p><Link className="monitor-link-button monitor-link-button--secondary" style={{ width: '100%', marginBottom: 8 }} to={`/trails/${item.transRefId}`}>Mở Trail <ExternalLink size={15} /></Link><Link className="monitor-link-button monitor-link-button--secondary" style={{ width: '100%' }} to={`/ledger/entries?transRefId=${encodeURIComponent(item.transRefId)}`}>Xem bút toán <ExternalLink size={15} /></Link></div>
    </aside></div>
  </main>
}
