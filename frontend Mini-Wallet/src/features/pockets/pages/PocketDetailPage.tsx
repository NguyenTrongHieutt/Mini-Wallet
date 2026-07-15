import { useState } from 'react'
import { AlertCircle, ArrowLeft, Clock3, ExternalLink, LockKeyhole, RefreshCw, ShieldCheck, UserRound, WalletCards } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { pocketErrorMessage } from '../api/pocketApi'
import { useChangePocketStatus, usePocket } from '../api/pocketQueries'
import { PocketStatusBadge } from '../components/PocketStatusBadge'
import { currencyCode, formatDate, formatMoney, isTransactionLocked, OWNER_LABELS } from '../utils'
import type { PocketStatus } from '../types'
import '../operations.css'

export function PocketDetailPage() {
  const { pocketId } = useParams<{ pocketId: string }>()
  const location = useLocation()
  const pocketQuery = usePocket(pocketId)
  const statusMutation = useChangePocketStatus()
  const [notice, setNotice] = useState<string | null>(
    (location.state as { created?: boolean } | null)?.created ? 'Ví đã được tạo thành công.' : null,
  )

  async function changeStatus(currentStatus: PocketStatus) {
    if (!pocketId || !pocketQuery.data || isTransactionLocked(pocketQuery.data)) return
    const targetStatus: PocketStatus = currentStatus === 'active' ? 'locked' : 'active'
    const isLocking = targetStatus === 'locked'
    if (!window.confirm(isLocking
      ? 'Khóa ví này? Các giao dịch mới sử dụng ví sẽ không thể thực hiện.'
      : 'Mở khóa để ví có thể tiếp tục tham gia giao dịch?')) return
    setNotice(null)
    try {
      const result = await statusMutation.mutateAsync({ pocketId, status: targetStatus })
      setNotice(result.changed ? (isLocking ? 'Đã khóa ví.' : 'Đã mở khóa ví.') : 'Trạng thái không thay đổi.')
    } catch {
      // Error is rendered below.
    }
  }

  if (pocketQuery.isLoading) return <main className="ops-page"><section className="ops-panel ops-state"><div className="ops-spinner" /><h2>Đang tải thông tin ví</h2></section></main>
  if (pocketQuery.isError || !pocketQuery.data) {
    return <main className="ops-page"><Link className="ops-link-button ops-link-button--secondary" to="/pockets"><ArrowLeft size={17} /> Danh sách ví</Link><section className="ops-panel ops-state" style={{ marginTop: 18 }}><AlertCircle size={36} /><h2>Không mở được ví</h2><p>{pocketErrorMessage(pocketQuery.error)}</p><button className="ops-button ops-button--secondary" onClick={() => pocketQuery.refetch()}>Thử lại</button></section></main>
  }

  const pocket = pocketQuery.data
  const transactionLocked = isTransactionLocked(pocket)
  const ownerLink = pocket.ownerType === 'customer'
    ? `/customers/${pocket.ownerId}`
    : pocket.ownerType === 'provider'
      ? `/providers/${pocket.ownerId}`
      : null

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div><Link className="ops-link-button ops-link-button--secondary" to="/pockets"><ArrowLeft size={17} /> Danh sách ví</Link><p className="ops-eyebrow" style={{ marginTop: 20 }}>Chi tiết ví</p><h1 className="ops-title">{pocket.name}</h1><p className="ops-subtitle">ID: {pocket.id}</p></div>
        <div className="ops-actions"><PocketStatusBadge status={pocket.status} lock={pocket.lock} /><button className="ops-button ops-button--secondary" type="button" onClick={() => pocketQuery.refetch()} disabled={pocketQuery.isFetching}><RefreshCw size={17} /> Làm mới</button><button className={`ops-button ${pocket.status === 'active' ? 'ops-button--danger' : 'ops-button--success'}`} type="button" disabled={statusMutation.isPending || transactionLocked} title={transactionLocked ? 'Không thể mở khóa thủ công khi giao dịch đang giữ ví' : undefined} onClick={() => changeStatus(pocket.status)}>{pocket.status === 'active' ? <LockKeyhole size={17} /> : <ShieldCheck size={17} />}{statusMutation.isPending ? 'Đang xử lý…' : pocket.status === 'active' ? 'Khóa ví' : 'Mở khóa ví'}</button></div>
      </header>

      {notice && <div className="ops-alert ops-alert--info" role="status"><ShieldCheck size={18} /><div>{notice}</div></div>}
      {statusMutation.isError && <div className="ops-alert ops-alert--error" role="alert"><AlertCircle size={18} /><div>{pocketErrorMessage(statusMutation.error)}</div></div>}
      {transactionLocked && <div className="ops-alert ops-alert--warning"><Clock3 size={19} /><div><strong>Giao dịch đang tạm giữ ví</strong><p>Đây là khóa an toàn tự động nên Officer không thể mở thủ công. Hãy chờ giao dịch hoàn tất hoặc hết hạn{pocket.lock?.lockExpiredAt ? ` vào ${formatDate(pocket.lock.lockExpiredAt)}` : ''}, rồi làm mới trạng thái.</p></div></div>}
      {pocket.status === 'locked' && pocket.lock?.type === 'officer' && <div className="ops-alert ops-alert--warning"><LockKeyhole size={19} /><div><strong>Ví bị khóa bởi Officer</strong><p>Ví sẽ không thể tham gia giao dịch mới cho đến khi được mở khóa.</p></div></div>}

      <div className="ops-detail-grid">
        <div className="ops-panel">
          <section className="ops-section">
            <div className="ops-metric"><div className="ops-metric__label">Số dư hiện tại</div><div className="ops-metric__value">{formatMoney(pocket.balance, pocket.currency)}</div></div>
          </section>
          <section className="ops-section"><h2 className="ops-section-title"><WalletCards size={19} /> Thông tin ví</h2><dl className="ops-data-grid"><div className="ops-data-item"><dt>Tên ví</dt><dd>{pocket.name}</dd></div><div className="ops-data-item"><dt>Loại tiền</dt><dd>{currencyCode(pocket.currency)}{typeof pocket.currency === 'object' && pocket.currency.name ? ` · ${pocket.currency.name}` : ''}</dd></div><div className="ops-data-item"><dt>Loại chủ sở hữu</dt><dd><span className="ops-owner-chip">{OWNER_LABELS[pocket.ownerType]}</span></dd></div><div className="ops-data-item"><dt>Mã chủ sở hữu</dt><dd>{pocket.ownerId}</dd></div><div className="ops-data-item"><dt>Ngày tạo</dt><dd>{formatDate(pocket.createdAt)}</dd></div><div className="ops-data-item"><dt>Cập nhật gần nhất</dt><dd>{formatDate(pocket.updatedAt)}</dd></div></dl></section>
          {pocket.lock && <section className="ops-section"><h2 className="ops-section-title"><LockKeyhole size={19} /> Thông tin khóa</h2><dl className="ops-data-grid"><div className="ops-data-item"><dt>Loại khóa</dt><dd>{pocket.lock.type === 'transaction' ? 'Khóa tự động bởi giao dịch' : 'Khóa vận hành bởi Officer'}</dd></div><div className="ops-data-item"><dt>Bắt đầu khóa</dt><dd>{formatDate(pocket.lock.lockedAt)}</dd></div><div className="ops-data-item"><dt>Thời điểm hết hạn</dt><dd>{pocket.lock.type === 'transaction' ? formatDate(pocket.lock.lockExpiredAt) : 'Không tự hết hạn'}</dd></div></dl></section>}
        </div>
        <aside className="ops-side-stack">
          <div className="ops-panel ops-side-card"><h3><UserRound size={16} style={{ verticalAlign: -3, marginRight: 7 }} />Chủ sở hữu</h3><p>{OWNER_LABELS[pocket.ownerType]}</p><strong style={{ overflowWrap: 'anywhere' }}>{pocket.ownerId}</strong>{ownerLink && <Link className="ops-link-button ops-link-button--secondary" style={{ marginTop: 15, width: '100%' }} to={ownerLink}>Mở hồ sơ <ExternalLink size={15} /></Link>}</div>
          <div className="ops-panel ops-side-card"><h3>Kiểm soát an toàn</h3><p>Khóa ví ngăn giao dịch mới nhưng không làm thay đổi số dư. Khóa giao dịch được hệ thống tự quản lý.</p></div>
        </aside>
      </div>
    </main>
  )
}
