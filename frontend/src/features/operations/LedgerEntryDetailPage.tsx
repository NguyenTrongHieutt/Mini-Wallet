import { AlertCircle, ArrowLeft, ExternalLink, RefreshCw, Scale, WalletCards } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { appConfig } from '@/config/app-config'
import { operationErrorMessage } from './api'
import { DetailItem, JsonDetails, StatusBadge } from './components'
import { useLedgerEntry } from './hooks'
import { formatAmount, formatDate } from './utils'
import type { PocketReference } from './types'
import './operations.css'

function PocketCard({ title, pocket }: { title: string; pocket?: PocketReference }) {
  if (!pocket) return null
  return <div className="monitor-panel monitor-side-card"><h3><WalletCards size={16} style={{ verticalAlign: -3, marginRight: 7 }} />{title}</h3>{pocket.missing ? <p>Ví {pocket.id} không còn tồn tại hoặc không thể truy cập.</p> : <><p><strong>{pocket.name}</strong></p><p>{pocket.ownerType} · {pocket.ownerId}</p><p>Trạng thái: {pocket.status}</p><Link className="monitor-link-button monitor-link-button--secondary" style={{ width: '100%', marginTop: 8 }} to={`/pockets/${pocket.id}`}>Mở ví <ExternalLink size={15} /></Link></>}</div>
}

export function LedgerEntryDetailPage() {
  const { entryId } = useParams<{ entryId: string }>()
  const location = useLocation()
  const query = useLedgerEntry(entryId)
  const back = (location.state as { from?: string } | null)?.from ?? '/ledger/entries'
  if (query.isLoading) return <main className="monitor-page"><section className="monitor-panel monitor-state"><span className="monitor-spinner" /><h2>Đang tải bút toán</h2></section></main>
  if (query.isError || !query.data) return <main className="monitor-page"><Link className="monitor-link-button monitor-link-button--secondary" to={back}><ArrowLeft size={17} /> Danh sách bút toán</Link><section className="monitor-panel monitor-state" style={{ marginTop: 18 }}><AlertCircle size={34} /><h2>Không mở được bút toán</h2><p>{operationErrorMessage(query.error)}</p><button className="monitor-button monitor-button--secondary" onClick={() => query.refetch()}>Thử lại</button></section></main>
  const entry = query.data
  const currency = entry.currency?.code ?? appConfig.defaultCurrency
  return <main className="monitor-page">
    <header className="monitor-header"><div><Link className="monitor-link-button monitor-link-button--secondary" to={back}><ArrowLeft size={17} /> Danh sách bút toán</Link><p className="monitor-eyebrow" style={{ marginTop: 18 }}>Chi tiết bút toán</p><h1 className="monitor-title">Bước #{entry.stepOrder}</h1><p className="monitor-subtitle">TransRef ID: {entry.transRefId}</p></div><div className="monitor-header__actions"><StatusBadge status={entry.status} /><button className="monitor-button monitor-button--secondary" onClick={() => query.refetch()}><RefreshCw size={17} /> Làm mới</button></div></header>
    <div className="monitor-detail-layout"><section className="monitor-panel">
      <div className="monitor-metric"><small>Giá trị định khoản</small><strong>{formatAmount(entry.amount, currency)}</strong><small>{entry.currency?.name ?? currency}</small></div>
      <div className="monitor-section"><h2 className="monitor-section-title"><Scale size={18} /> Thông tin đối soát</h2><dl className="monitor-detail-grid"><DetailItem label="Mã bút toán">{entry.id}</DetailItem><DetailItem label="Bước định khoản">#{entry.stepOrder}</DetailItem><DetailItem label="Trạng thái"><StatusBadge status={entry.status} /></DetailItem><DetailItem label="Loại tiền">{entry.currency?.missing ? `Không tìm thấy (${entry.currency.id})` : `${entry.currency?.name ?? ''} (${currency})`}</DetailItem><DetailItem label="Khởi tạo lúc">{formatDate(entry.createdAt)}</DetailItem><DetailItem label="Cập nhật lúc">{formatDate(entry.updatedAt)}</DetailItem></dl></div>
      <JsonDetails value={entry} />
    </section><aside className="monitor-side-stack"><PocketCard title="Ví ghi nợ" pocket={entry.debitPocket} /><PocketCard title="Ví ghi có" pocket={entry.creditPocket} /><div className="monitor-panel monitor-side-card"><h3>Giao dịch liên quan</h3><p>{entry.transRefId}</p><Link className="monitor-link-button monitor-link-button--secondary" style={{ width: '100%', marginBottom: 8 }} to={`/transactions?transRefId=${encodeURIComponent(entry.transRefId)}`}>Tìm giao dịch <ExternalLink size={15} /></Link><Link className="monitor-link-button monitor-link-button--secondary" style={{ width: '100%' }} to={`/trails/${entry.transRefId}`}>Mở Trail <ExternalLink size={15} /></Link></div></aside></div>
  </main>
}
