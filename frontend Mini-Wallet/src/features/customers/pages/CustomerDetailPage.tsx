import { useState } from 'react'
import { AlertCircle, ArrowLeft, CalendarDays, LockKeyhole, Phone, ShieldCheck, UserRound, WalletCards } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { customerErrorMessage } from '../api/customerApi'
import { useChangeCustomerStatus, useCustomer } from '../api/customerQueries'
import { CustomerStatusBadge } from '../components/CustomerStatusBadge'
import { PocketStatusBadge } from '@/features/pockets/components/PocketStatusBadge'
import { currencyCode, formatDate, formatMoney } from '@/features/pockets/utils'
import type { CustomerStatus } from '../types'
import '@/features/pockets/operations.css'

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const customerQuery = useCustomer(customerId)
  const statusMutation = useChangeCustomerStatus()
  const [notice, setNotice] = useState<string | null>(null)

  async function changeStatus(currentStatus: CustomerStatus) {
    if (!customerId) return
    const targetStatus: CustomerStatus = currentStatus === 'active' ? 'locked' : 'active'
    const isLocking = targetStatus === 'locked'
    if (!window.confirm(isLocking
      ? 'Khóa khách hàng này? Các phiên đăng nhập hiện tại sẽ bị thu hồi.'
      : 'Mở khóa để khách hàng có thể đăng nhập và tiếp tục sử dụng dịch vụ?')) return

    setNotice(null)
    try {
      const result = await statusMutation.mutateAsync({ customerId, status: targetStatus })
      setNotice(result.changed ? (isLocking ? 'Đã khóa khách hàng.' : 'Đã mở khóa khách hàng.') : 'Trạng thái không thay đổi.')
    } catch {
      // Render mutation error in context.
    }
  }

  if (customerQuery.isLoading) {
    return <main className="ops-page"><section className="ops-panel ops-state"><div className="ops-spinner" /><h2>Đang tải hồ sơ</h2></section></main>
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <main className="ops-page">
        <Link className="ops-link-button ops-link-button--secondary" to="/customers"><ArrowLeft size={17} /> Danh sách khách hàng</Link>
        <section className="ops-panel ops-state" style={{ marginTop: 18 }}><AlertCircle size={36} /><h2>Không mở được hồ sơ</h2><p>{customerErrorMessage(customerQuery.error)}</p><button className="ops-button ops-button--secondary" onClick={() => customerQuery.refetch()}>Thử lại</button></section>
      </main>
    )
  }

  const { customer, pockets } = customerQuery.data

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div>
          <Link className="ops-link-button ops-link-button--secondary" to="/customers"><ArrowLeft size={17} /> Danh sách khách hàng</Link>
          <p className="ops-eyebrow" style={{ marginTop: 20 }}>Hồ sơ khách hàng</p>
          <h1 className="ops-title">{customer.displayName || 'Khách hàng chưa đặt tên'}</h1>
          <p className="ops-subtitle">ID: {customer.id}</p>
        </div>
        <div className="ops-actions">
          <CustomerStatusBadge status={customer.status} />
          <button
            className={`ops-button ${customer.status === 'active' ? 'ops-button--danger' : 'ops-button--success'}`}
            type="button"
            disabled={statusMutation.isPending}
            onClick={() => changeStatus(customer.status)}
          >
            {customer.status === 'active' ? <LockKeyhole size={17} /> : <ShieldCheck size={17} />}
            {statusMutation.isPending ? 'Đang xử lý…' : customer.status === 'active' ? 'Khóa khách hàng' : 'Mở khóa khách hàng'}
          </button>
        </div>
      </header>

      {customer.status === 'locked' && <div className="ops-alert ops-alert--warning"><LockKeyhole size={18} /><div><strong>Tài khoản đang bị khóa</strong><p>Khách hàng không thể đăng nhập. Các ví vẫn được hiển thị để Officer kiểm tra độc lập.</p></div></div>}
      {notice && <div className="ops-alert ops-alert--info" role="status"><ShieldCheck size={18} /><div>{notice}</div></div>}
      {statusMutation.isError && <div className="ops-alert ops-alert--error" role="alert"><AlertCircle size={18} /><div>{customerErrorMessage(statusMutation.error)}</div></div>}

      <div className="ops-detail-grid">
        <div className="ops-panel">
          <section className="ops-section">
            <h2 className="ops-section-title"><UserRound size={19} /> Thông tin cơ bản</h2>
            <dl className="ops-data-grid">
              <div className="ops-data-item"><dt>Tên hiển thị</dt><dd>{customer.displayName || 'Chưa cập nhật'}</dd></div>
              <div className="ops-data-item"><dt>Số điện thoại</dt><dd><Phone size={14} style={{ verticalAlign: -2, marginRight: 6 }} />{customer.phone}</dd></div>
              <div className="ops-data-item"><dt>Ngày tham gia</dt><dd>{formatDate(customer.createdAt)}</dd></div>
              <div className="ops-data-item"><dt>Cập nhật gần nhất</dt><dd>{formatDate(customer.updatedAt)}</dd></div>
            </dl>
          </section>
          <section className="ops-section">
            <h2 className="ops-section-title"><WalletCards size={19} /> Ví của khách hàng ({pockets.length})</h2>
            {pockets.length === 0 ? (
              <div className="ops-state" style={{ minHeight: 180, padding: 24 }}><WalletCards size={30} /><h2>Chưa có ví</h2><p>Khách hàng này chưa sở hữu ví nào.</p></div>
            ) : (
              <div className="ops-card-list">
                {pockets.map((pocket) => (
                  <Link className="ops-pocket-card" to={`/pockets/${pocket.id}`} key={pocket.id}>
                    <div className="ops-pocket-card__top"><h3>{pocket.name}</h3><PocketStatusBadge status={pocket.status} /></div>
                    <div className="ops-pocket-card__balance">{formatMoney(pocket.balance, pocket.currency)}</div>
                    <div className="ops-pocket-card__meta">{currencyCode(pocket.currency)} · Xem chi tiết ví</div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="ops-side-stack">
          <div className="ops-panel ops-side-card"><h3><CalendarDays size={16} style={{ verticalAlign: -3, marginRight: 7 }} />Hoạt động hồ sơ</h3><p>Cập nhật gần nhất</p><strong>{formatDate(customer.updatedAt)}</strong></div>
          <div className="ops-panel ops-side-card"><h3>Phân tách trạng thái</h3><p>Khóa khách hàng chỉ thu hồi quyền đăng nhập. Muốn chặn biến động số dư, hãy kiểm soát trạng thái của từng ví.</p><Link className="ops-link-button ops-link-button--secondary" to={`/pockets?ownerType=customer&q=${encodeURIComponent(customer.id)}`}>Xem trong quản lý ví</Link></div>
        </aside>
      </div>
    </main>
  )
}
