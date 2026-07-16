import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, RefreshCw, Search } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { appConfig } from '@/config/app-config'
import { Pagination, QueryState, StatusBadge } from './components'
import { useTransactions } from './hooks'
import type { TransactionFilters } from './types'
import { formatAmount, formatDate, optionalNumber, positiveInteger } from './utils'
import './operations.css'

type TransactionFilterDraft = {
  q: string
  transRefId: string
  serviceCode: string
  status: string
  senderCustomerId: string
  receiverCustomerId: string
  receiverProviderId: string
  amountFrom: string
  amountTo: string
  dateFrom: string
  dateTo: string
}

const transactionFilterKeys: Array<keyof TransactionFilterDraft> = [
  'q', 'transRefId', 'serviceCode', 'status', 'senderCustomerId', 'receiverCustomerId',
  'receiverProviderId', 'amountFrom', 'amountTo', 'dateFrom', 'dateTo',
]

function draftFromParams(params: URLSearchParams): TransactionFilterDraft {
  return {
    q: params.get('q') ?? '',
    transRefId: params.get('transRefId') ?? '',
    serviceCode: params.get('serviceCode') ?? '',
    status: params.get('status') ?? '',
    senderCustomerId: params.get('senderCustomerId') ?? '',
    receiverCustomerId: params.get('receiverCustomerId') ?? '',
    receiverProviderId: params.get('receiverProviderId') ?? '',
    amountFrom: params.get('amountFrom') ?? '',
    amountTo: params.get('amountTo') ?? '',
    dateFrom: params.get('dateFrom') ?? '',
    dateTo: params.get('dateTo') ?? '',
  }
}

export function TransactionListPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [draft, setDraft] = useState<TransactionFilterDraft>(() => draftFromParams(params))
  const filters = useMemo<TransactionFilters>(() => ({
    page: positiveInteger(params.get('page'), 1),
    pageSize: Math.min(
      positiveInteger(params.get('pageSize'), appConfig.pagination.defaultPageSize),
      appConfig.pagination.maxPageSize,
    ),
    q: params.get('q') || undefined,
    status: params.get('status') || undefined,
    serviceCode: params.get('serviceCode') || undefined,
    transRefId: params.get('transRefId') || undefined,
    senderCustomerId: params.get('senderCustomerId') || undefined,
    receiverCustomerId: params.get('receiverCustomerId') || undefined,
    receiverProviderId: params.get('receiverProviderId') || undefined,
    amountFrom: optionalNumber(params.get('amountFrom')),
    amountTo: optionalNumber(params.get('amountTo')),
    dateFrom: params.get('dateFrom') || undefined,
    dateTo: params.get('dateTo') || undefined,
    sortBy: 'createdAt',
    sortOrder: params.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC',
  }), [params])
  const transactions = useTransactions(filters)

  useEffect(() => {
    setDraft(draftFromParams(params))
  }, [params])

  function updateDraft(key: keyof TransactionFilterDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams(params)
    transactionFilterKeys.forEach((key) => {
      const value = draft[key].trim()
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
        <p className="monitor-eyebrow">Vận hành giao dịch</p>
        <h1 className="monitor-title">Giao dịch</h1>
        <p className="monitor-subtitle">Tra cứu giao dịch theo mã, bên gửi/nhận, khoảng tiền và thời gian.</p>
      </div>
      <button className="monitor-button monitor-button--secondary" type="button" onClick={() => transactions.refetch()} disabled={transactions.isFetching}>
        <RefreshCw size={17}/> Làm mới
      </button>
    </header>

    <form className="monitor-panel monitor-filter" onSubmit={applyFilters}>
      <div className="monitor-filter-grid monitor-filter-grid--wide">
        <label className="monitor-field"><span>Tìm giao dịch</span><input value={draft.q} onChange={(event) => updateDraft('q', event.target.value)} placeholder="Mã hoặc nội dung"/></label>
        <label className="monitor-field"><span>TransRef ID</span><input value={draft.transRefId} onChange={(event) => updateDraft('transRefId', event.target.value)}/></label>
        <label className="monitor-field"><span>Mã dịch vụ</span><input value={draft.serviceCode} onChange={(event) => updateDraft('serviceCode', event.target.value.toUpperCase())} placeholder="CASH_IN"/></label>
        <label className="monitor-field"><span>Trạng thái</span><select value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}><option value="">Tất cả</option><option value="done">Thành công</option><option value="failed">Thất bại</option></select></label>
        <label className="monitor-field"><span>Khách hàng gửi</span><input value={draft.senderCustomerId} onChange={(event) => updateDraft('senderCustomerId', event.target.value)}/></label>
        <label className="monitor-field"><span>Khách hàng nhận</span><input value={draft.receiverCustomerId} onChange={(event) => updateDraft('receiverCustomerId', event.target.value)}/></label>
        <label className="monitor-field"><span>Provider nhận</span><input value={draft.receiverProviderId} onChange={(event) => updateDraft('receiverProviderId', event.target.value)}/></label>
        <label className="monitor-field"><span>Số tiền từ</span><input type="number" min="0" value={draft.amountFrom} onChange={(event) => updateDraft('amountFrom', event.target.value)}/></label>
        <label className="monitor-field"><span>Số tiền đến</span><input type="number" min="0" value={draft.amountTo} onChange={(event) => updateDraft('amountTo', event.target.value)}/></label>
        <label className="monitor-field"><span>Từ ngày</span><input type="date" value={draft.dateFrom} onChange={(event) => updateDraft('dateFrom', event.target.value)}/></label>
        <label className="monitor-field"><span>Đến ngày</span><input type="date" value={draft.dateTo} onChange={(event) => updateDraft('dateTo', event.target.value)}/></label>
        <div className="monitor-filter-actions">
          <button className="monitor-button monitor-button--primary" type="submit"><Search size={16}/> Tìm kiếm</button>
          <button className="monitor-button monitor-button--secondary" type="button" onClick={clearFilters}>Xóa lọc</button>
        </div>
      </div>
    </form>

    <section className="monitor-panel">
      <QueryState loading={transactions.isLoading} error={transactions.error} empty={!transactions.data?.items.length} noun="giao dịch" retry={() => transactions.refetch()}>
        <div className="monitor-table-wrap">
          <table className="monitor-table">
            <thead><tr><th>Giao dịch</th><th>Dịch vụ</th><th>Số tiền</th><th>Đối tượng nhận</th><th>Trạng thái</th><th>Thời gian</th><th/></tr></thead>
            <tbody>{transactions.data?.items.map((item) => <tr key={item.id}>
              <td><div className="monitor-table__primary">{item.code}</div><div className="monitor-table__secondary">Ref: {item.transRefId}</div></td>
              <td>{item.serviceId}</td>
              <td><div className="monitor-table__primary">{formatAmount(item.amount)}</div><div className="monitor-table__secondary">Tổng {formatAmount(item.totalAmount)}</div></td>
              <td>{item.receiverCustomerId ? <Link className="monitor-table__link" to={`/customers/${item.receiverCustomerId}`}>Khách hàng</Link> : item.receiverProviderId ? <Link className="monitor-table__link" to={`/providers/${item.receiverProviderId}`}>Provider</Link> : '—'}</td>
              <td><StatusBadge status={item.status}/></td>
              <td>{formatDate(item.createdAt)}</td>
              <td><div className="monitor-table__actions"><Link className="monitor-icon-button" to={`/transactions/${item.id}`} state={{ from: `${location.pathname}${location.search}` }} aria-label="Xem chi tiết"><Eye size={17}/></Link></div></td>
            </tr>)}</tbody>
          </table>
        </div>
        {transactions.data && <Pagination {...transactions.data.pagination} onChange={changePage}/>} 
      </QueryState>
    </section>
  </main>
}
