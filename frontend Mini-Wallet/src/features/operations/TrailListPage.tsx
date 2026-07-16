import { useMemo, useState } from 'react'
import { Eye, RefreshCw, Search } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Pagination, QueryState, StatusBadge } from './components'
import { useTrails } from './hooks'
import type { TrailFilters } from './types'
import { formatDate, positiveInteger } from './utils'
import './operations.css'

export function TrailListPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const query = params.get('q') ?? ''
  const [draft, setDraft] = useState(query)
  const filters = useMemo<TrailFilters>(() => ({
    page: positiveInteger(params.get('page'), 1),
    pageSize: Math.min(positiveInteger(params.get('pageSize'), 20), 100),
    q: query || undefined,
    status: params.get('status') || undefined,
    serviceCode: params.get('serviceCode') || undefined,
    customerId: params.get('customerId') || undefined,
    officerId: params.get('officerId') || undefined,
    dateFrom: params.get('dateFrom') || undefined,
    dateTo: params.get('dateTo') || undefined,
    sortBy: 'createdAt',
    sortOrder: params.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC',
  }), [params, query])
  const trails = useTrails(filters)

  function patch(values: Record<string, string | number | undefined>, resetPage = true) {
    const next = new URLSearchParams(params)
    Object.entries(values).forEach(([key, value]) => value === '' || value === undefined ? next.delete(key) : next.set(key, String(value)))
    if (resetPage) next.set('page', '1')
    setParams(next)
  }

  return <main className="monitor-page">
    <header className="monitor-header"><div><p className="monitor-eyebrow">Giám sát luồng xử lý</p><h1 className="monitor-title">Transaction Trail</h1><p className="monitor-subtitle">Theo dõi từng lần chạy dịch vụ, thời hạn xử lý và nguyên nhân lỗi.</p></div><button className="monitor-button monitor-button--secondary" onClick={() => trails.refetch()} disabled={trails.isFetching}><RefreshCw size={17} /> Làm mới</button></header>
    <form className="monitor-panel monitor-filter" onSubmit={(event) => { event.preventDefault(); patch({ q: draft.trim() }) }}>
      <div className="monitor-filter-grid monitor-filter-grid--wide">
        <label className="monitor-field"><span>Tìm lỗi</span><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Mã lỗi hoặc nội dung lỗi" /></label>
        <label className="monitor-field"><span>Mã dịch vụ</span><input value={filters.serviceCode ?? ''} onChange={(event) => patch({ serviceCode: event.target.value })} placeholder="TRANSFER" /></label>
        <label className="monitor-field"><span>Trạng thái</span><select value={filters.status ?? ''} onChange={(event) => patch({ status: event.target.value })}><option value="">Tất cả</option><option value="init">Khởi tạo</option><option value="draft">Bản nháp</option><option value="pending">Đang xử lý</option><option value="done">Hoàn tất</option><option value="failed">Thất bại</option><option value="cancelled">Đã hủy</option></select></label>
        <label className="monitor-field"><span>Từ ngày</span><input type="date" value={filters.dateFrom ?? ''} onChange={(event) => patch({ dateFrom: event.target.value })} /></label>
        <label className="monitor-field"><span>Đến ngày</span><input type="date" value={filters.dateTo ?? ''} onChange={(event) => patch({ dateTo: event.target.value })} /></label>
        <label className="monitor-field"><span>Mã khách hàng</span><input value={filters.customerId ?? ''} onChange={(event) => patch({ customerId: event.target.value })} /></label>
        <label className="monitor-field"><span>Mã Officer</span><input value={filters.officerId ?? ''} onChange={(event) => patch({ officerId: event.target.value })} /></label>
        <label className="monitor-field"><span>Thứ tự</span><select value={filters.sortOrder} onChange={(event) => patch({ sortOrder: event.target.value })}><option value="DESC">Mới nhất trước</option><option value="ASC">Cũ nhất trước</option></select></label>
        <div className="monitor-filter-actions"><button className="monitor-button monitor-button--primary" type="submit"><Search size={16} /> Tìm kiếm</button><button className="monitor-button monitor-button--secondary" type="button" onClick={() => { setDraft(''); setParams(new URLSearchParams()) }}>Xóa lọc</button></div>
      </div>
    </form>
    <section className="monitor-panel"><QueryState loading={trails.isLoading} error={trails.error} empty={!trails.data?.items.length} noun="nhật ký" retry={() => trails.refetch()}>
      <div className="monitor-table-wrap"><table className="monitor-table"><thead><tr><th>Dịch vụ / Trail</th><th>Trạng thái</th><th>Khách hàng</th><th>Lỗi</th><th>Thời gian</th><th /></tr></thead><tbody>{trails.data?.items.map((trail) => <tr key={trail.id}>
        <td><div className="monitor-table__primary">{trail.service.code ?? trail.service.id}</div><div className="monitor-table__secondary">{trail.id}</div></td>
        <td><StatusBadge status={trail.isExpired ? 'expired' : trail.status} /></td>
        <td>{trail.customerId ? <Link className="monitor-table__link" to={`/customers/${trail.customerId}`}>{trail.customerId}</Link> : '—'}</td>
        <td><div className="monitor-table__primary">{trail.errorCode ?? '—'}</div><div className="monitor-table__secondary">{trail.errorMessage}</div></td>
        <td>{formatDate(trail.createdAt)}{trail.isExpired && <div className="monitor-table__secondary">Đã hết hạn</div>}</td>
        <td><div className="monitor-table__actions"><Link className="monitor-icon-button" to={`/trails/${trail.id}`} state={{ from: `${location.pathname}${location.search}` }} aria-label="Xem chi tiết"><Eye size={17} /></Link></div></td>
      </tr>)}</tbody></table></div>
      {trails.data && <Pagination {...trails.data.pagination} onChange={(value) => patch(value, false)} />}
    </QueryState></section>
  </main>
}
