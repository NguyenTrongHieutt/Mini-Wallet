import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, RefreshCw, Search } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Pagination, QueryState, StatusBadge } from './components'
import { useLedgerEntries } from './hooks'
import type { LedgerFilters } from './types'
import { formatAmount, formatDate, positiveInteger } from './utils'
import './operations.css'

type LedgerFilterDraft = {
  transRefId: string
  pocketId: string
  direction: string
  currency: string
  status: string
  dateFrom: string
  dateTo: string
  sortOrder: string
}

const ledgerFilterKeys: Array<keyof LedgerFilterDraft> = [
  'transRefId', 'pocketId', 'direction', 'currency', 'status', 'dateFrom', 'dateTo', 'sortOrder',
]

function draftFromParams(params: URLSearchParams): LedgerFilterDraft {
  return {
    transRefId: params.get('transRefId') ?? '',
    pocketId: params.get('pocketId') ?? '',
    direction: params.get('direction') ?? '',
    currency: params.get('currency') ?? '',
    status: params.get('status') ?? '',
    dateFrom: params.get('dateFrom') ?? '',
    dateTo: params.get('dateTo') ?? '',
    sortOrder: params.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC',
  }
}

export function LedgerEntryListPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [draft, setDraft] = useState<LedgerFilterDraft>(() => draftFromParams(params))
  const filters = useMemo<LedgerFilters>(() => ({
    page: positiveInteger(params.get('page'), 1),
    pageSize: Math.min(positiveInteger(params.get('pageSize'), 20), 100),
    transRefId: params.get('transRefId') || undefined,
    status: params.get('status') || undefined,
    pocketId: params.get('pocketId') || undefined,
    direction: params.get('direction') === 'debit' || params.get('direction') === 'credit' ? params.get('direction') as 'debit' | 'credit' : undefined,
    currency: params.get('currency') || undefined,
    dateFrom: params.get('dateFrom') || undefined,
    dateTo: params.get('dateTo') || undefined,
    sortBy: 'createdAt',
    sortOrder: params.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC',
  }), [params])
  const entries = useLedgerEntries(filters)

  useEffect(() => {
    setDraft(draftFromParams(params))
  }, [params])

  function updateDraft(key: keyof LedgerFilterDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams(params)
    ledgerFilterKeys.forEach((key) => {
      const value = key === 'direction' && !draft.pocketId.trim() ? '' : draft[key].trim()
      if (value) next.set(key, value)
      else next.delete(key)
    })
    next.set('page', '1')
    setParams(next)
  }

  function clearFilters() {
    setDraft(draftFromParams(new URLSearchParams()))
    setParams(new URLSearchParams())
  }

  function changePage(values: { page?: number; pageSize?: number }) {
    const next = new URLSearchParams(params)
    if (values.page !== undefined) next.set('page', String(values.page))
    if (values.pageSize !== undefined) next.set('pageSize', String(values.pageSize))
    setParams(next)
  }

  return <main className="monitor-page">
    <header className="monitor-header">
      <div>
        <p className="monitor-eyebrow">Sổ cái Mini-Wallet</p>
        <h1 className="monitor-title">Bút toán</h1>
        <p className="monitor-subtitle">Đối soát các cặp ghi nợ – ghi có theo giao dịch, ví và loại tiền.</p>
      </div>
      <button className="monitor-button monitor-button--secondary" type="button" onClick={() => entries.refetch()} disabled={entries.isFetching}>
        <RefreshCw size={17}/> Làm mới
      </button>
    </header>

    <form className="monitor-panel monitor-filter" onSubmit={applyFilters}>
      <div className="monitor-filter-grid monitor-filter-grid--wide">
        <label className="monitor-field"><span>TransRef ID</span><input value={draft.transRefId} onChange={(event) => updateDraft('transRefId', event.target.value)}/></label>
        <label className="monitor-field"><span>Mã ví</span><input value={draft.pocketId} onChange={(event) => updateDraft('pocketId', event.target.value)}/></label>
        <label className="monitor-field"><span>Vai trò của ví</span><select value={draft.direction} disabled={!draft.pocketId.trim()} onChange={(event) => updateDraft('direction', event.target.value)}><option value="">Ghi nợ hoặc ghi có</option><option value="debit">Bên ghi nợ</option><option value="credit">Bên ghi có</option></select></label>
        <label className="monitor-field"><span>Loại tiền</span><input value={draft.currency} onChange={(event) => updateDraft('currency', event.target.value.toUpperCase())} placeholder="VND"/></label>
        <label className="monitor-field"><span>Trạng thái</span><select value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}><option value="">Tất cả</option><option value="success">Thành công</option><option value="pending">Đang xử lý</option><option value="failed">Thất bại</option></select></label>
        <label className="monitor-field"><span>Từ ngày</span><input type="date" value={draft.dateFrom} onChange={(event) => updateDraft('dateFrom', event.target.value)}/></label>
        <label className="monitor-field"><span>Đến ngày</span><input type="date" value={draft.dateTo} onChange={(event) => updateDraft('dateTo', event.target.value)}/></label>
        <label className="monitor-field"><span>Thứ tự</span><select value={draft.sortOrder} onChange={(event) => updateDraft('sortOrder', event.target.value)}><option value="DESC">Mới nhất trước</option><option value="ASC">Cũ nhất trước</option></select></label>
        <div className="monitor-filter-actions">
          <button className="monitor-button monitor-button--primary" type="submit"><Search size={16}/> Tìm kiếm</button>
          <button className="monitor-button monitor-button--secondary" type="button" onClick={clearFilters}>Xóa lọc</button>
        </div>
      </div>
    </form>

    <section className="monitor-panel">
      <QueryState loading={entries.isLoading} error={entries.error} empty={!entries.data?.items.length} noun="bút toán" retry={() => entries.refetch()}>
        <div className="monitor-table-wrap">
          <table className="monitor-table">
            <thead><tr><th>Tham chiếu</th><th>Bước</th><th>Ví ghi nợ</th><th>Ví ghi có</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th><th/></tr></thead>
            <tbody>{entries.data?.items.map((entry) => <tr key={entry.id}>
              <td><div className="monitor-table__primary">{entry.transRefId}</div><div className="monitor-table__secondary">{entry.id}</div></td>
              <td>#{entry.stepOrder}</td>
              <td><Link className="monitor-table__link" to={`/pockets/${entry.debitPocketId}`}>{entry.debitPocketId}</Link></td>
              <td><Link className="monitor-table__link" to={`/pockets/${entry.creditPocketId}`}>{entry.creditPocketId}</Link></td>
              <td className="monitor-table__primary">{formatAmount(entry.amount)}</td>
              <td><StatusBadge status={entry.status}/></td>
              <td>{formatDate(entry.createdAt)}</td>
              <td><div className="monitor-table__actions"><Link className="monitor-icon-button" to={`/ledger/entries/${entry.id}`} state={{ from: `${location.pathname}${location.search}` }} aria-label="Xem chi tiết"><Eye size={17}/></Link></div></td>
            </tr>)}</tbody>
          </table>
        </div>
        {entries.data && <Pagination {...entries.data.pagination} onChange={changePage}/>} 
      </QueryState>
    </section>
  </main>
}
