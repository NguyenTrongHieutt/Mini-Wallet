import { useMemo, useState } from 'react'
import { AlertCircle, Eye, LockKeyhole, Plus, RefreshCw, Search, ShieldCheck, WalletCards } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { pocketErrorMessage } from '../api/pocketApi'
import { useChangePocketStatus, usePockets } from '../api/pocketQueries'
import { OperationsPagination } from '../components/OperationsPagination'
import { PocketStatusBadge } from '../components/PocketStatusBadge'
import { currencyCode, formatDate, formatMoney, isTransactionLocked, OWNER_LABELS } from '../utils'
import { appConfig } from '@/config/app-config'
import { paginationFromSearch } from '@/shared/url-query'
import type { Pocket, PocketFilters, PocketOwnerType, PocketSortField } from '../types'
import '../operations.css'

const VALID_OWNER_TYPES: PocketOwnerType[] = ['customer', 'provider', 'system', 'bank']
const VALID_SORTS: PocketSortField[] = ['name', 'ownerType', 'ownerId', 'balance', 'status', 'createdAt', 'updatedAt']

export function PocketListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [searchDraft, setSearchDraft] = useState(q)
  const [currencyDraft, setCurrencyDraft] = useState(searchParams.get('currency') ?? '')
  const [notice, setNotice] = useState<string | null>(null)

  const filters = useMemo<PocketFilters>(() => {
    const ownerType = searchParams.get('ownerType') as PocketOwnerType | null
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') as PocketSortField | null
    const pagination = paginationFromSearch(searchParams)
    return {
      ...pagination,
      q: q || undefined,
      ownerType: ownerType && VALID_OWNER_TYPES.includes(ownerType) ? ownerType : undefined,
      status: status === 'active' || status === 'locked' ? status : undefined,
      currency: searchParams.get('currency')?.toUpperCase() || undefined,
      sortBy: sortBy && VALID_SORTS.includes(sortBy) ? sortBy : 'createdAt',
      sortOrder: searchParams.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC',
    }
  }, [q, searchParams])

  const pocketsQuery = usePockets(filters)
  const statusMutation = useChangePocketStatus()

  function updateFilters(values: Record<string, string | number | undefined>, resetPage = true) {
    const next = new URLSearchParams(searchParams)
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    })
    if (resetPage) next.set('page', '1')
    setSearchParams(next)
  }

  async function changeStatus(pocket: Pocket) {
    if (isTransactionLocked(pocket)) return
    const targetStatus = pocket.status === 'active' ? 'locked' : 'active'
    const isLocking = targetStatus === 'locked'
    if (!window.confirm(isLocking
      ? `Khóa ví “${pocket.name}”? Các giao dịch mới dùng ví này sẽ không thể thực hiện.`
      : `Mở khóa ví “${pocket.name}” để ví có thể tiếp tục giao dịch?`)) return

    setNotice(null)
    try {
      const result = await statusMutation.mutateAsync({ pocketId: pocket.id, status: targetStatus })
      setNotice(result.changed ? (isLocking ? 'Đã khóa ví.' : 'Đã mở khóa ví.') : 'Ví đã ở trạng thái mong muốn.')
    } catch {
      // Error is rendered in context.
    }
  }

  const result = pocketsQuery.data

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div><p className="ops-eyebrow">Dòng tiền & số dư</p><h1 className="ops-title">Quản lý ví</h1><p className="ops-subtitle">Theo dõi toàn bộ ví và phân biệt khóa vận hành với khóa tạm thời do giao dịch.</p></div>
        <div className="ops-actions">
          <button className="ops-button ops-button--secondary" type="button" onClick={() => pocketsQuery.refetch()} disabled={pocketsQuery.isFetching}><RefreshCw size={17} /> Làm mới</button>
          <Link className="ops-link-button ops-link-button--primary" to="/pockets/new"><Plus size={17} /> Tạo ví Hệ thống / Ngân hàng</Link>
        </div>
      </header>

      <form
        className="ops-panel ops-filter-panel"
        onSubmit={(event) => {
          event.preventDefault()
          updateFilters({ q: searchDraft.trim(), currency: currencyDraft.trim().toUpperCase() })
        }}
      >
        <div className="ops-filter-grid">
          <label className="ops-field"><span>Tìm kiếm</span><span className="ops-search-wrap"><Search size={17} /><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Tên ví hoặc mã chủ sở hữu" /></span></label>
          <label className="ops-field"><span>Loại chủ sở hữu</span><select value={filters.ownerType ?? ''} onChange={(event) => updateFilters({ ownerType: event.target.value })}><option value="">Tất cả</option>{VALID_OWNER_TYPES.map((type) => <option value={type} key={type}>{OWNER_LABELS[type]}</option>)}</select></label>
          <label className="ops-field"><span>Trạng thái</span><select value={filters.status ?? ''} onChange={(event) => updateFilters({ status: event.target.value })}><option value="">Tất cả</option><option value="active">Hoạt động</option><option value="locked">Đã khóa</option></select></label>
          <label className="ops-field"><span>Tiền tệ</span><input value={currencyDraft} maxLength={3} onChange={(event) => setCurrencyDraft(event.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder={appConfig.defaultCurrency} /></label>
          <div className="ops-filter-actions"><button className="ops-button ops-button--primary" type="submit">Áp dụng</button><button className="ops-button ops-button--secondary" type="button" onClick={() => { setSearchDraft(''); setCurrencyDraft(''); setSearchParams(new URLSearchParams()) }}>Xóa lọc</button></div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <label className="ops-field" style={{ minWidth: 210 }}><span>Sắp xếp</span><select value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => { const [sortBy, sortOrder] = event.target.value.split(':'); updateFilters({ sortBy, sortOrder }) }}><option value="createdAt:DESC">Mới tạo gần đây</option><option value="updatedAt:DESC">Mới cập nhật</option><option value="name:ASC">Tên A–Z</option><option value="balance:DESC">Số dư cao nhất</option><option value="balance:ASC">Số dư thấp nhất</option></select></label>
        </div>
      </form>

      {notice && <div className="ops-alert ops-alert--info" role="status"><ShieldCheck size={18} /><div>{notice}</div></div>}
      {statusMutation.isError && <div className="ops-alert ops-alert--error" role="alert"><AlertCircle size={18} /><div>{pocketErrorMessage(statusMutation.error)}</div></div>}

      <section className="ops-panel" aria-label="Danh sách ví">
        {pocketsQuery.isLoading ? (
          <div className="ops-state"><div className="ops-spinner" /><h2>Đang tải danh sách ví</h2></div>
        ) : pocketsQuery.isError ? (
          <div className="ops-state"><AlertCircle size={35} /><h2>Chưa tải được danh sách ví</h2><p>{pocketErrorMessage(pocketsQuery.error)}</p><button className="ops-button ops-button--secondary" onClick={() => pocketsQuery.refetch()}>Thử lại</button></div>
        ) : !result?.items.length ? (
          <div className="ops-state"><WalletCards size={37} /><h2>Không tìm thấy ví</h2><p>Hãy thử thay đổi điều kiện lọc hoặc tạo ví Hệ thống / Ngân hàng mới.</p></div>
        ) : (
          <>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <thead><tr><th>Ví</th><th>Chủ sở hữu</th><th>Số dư</th><th>Trạng thái</th><th>Cập nhật</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
                <tbody>{result.items.map((pocket) => {
                  const transactionLocked = isTransactionLocked(pocket)
                  return (
                    <tr key={pocket.id}>
                      <td><div className="ops-table__primary">{pocket.name}</div><div className="ops-table__secondary">{currencyCode(pocket.currency)} · ID {pocket.id}</div></td>
                      <td><span className="ops-owner-chip">{OWNER_LABELS[pocket.ownerType]}</span><div className="ops-table__secondary">{pocket.ownerId}</div></td>
                      <td className="ops-table__primary">{formatMoney(pocket.balance, pocket.currency)}</td>
                      <td><PocketStatusBadge status={pocket.status} lock={pocket.lock} /></td>
                      <td>{formatDate(pocket.updatedAt)}</td>
                      <td><div className="ops-table__actions"><Link className="ops-icon-button" to={`/pockets/${pocket.id}`} title="Xem chi tiết" aria-label={`Xem ví ${pocket.name}`}><Eye size={17} /></Link><button className="ops-icon-button" type="button" disabled={statusMutation.isPending || transactionLocked} title={transactionLocked ? 'Giao dịch đang giữ khóa; Officer không thể mở thủ công' : pocket.status === 'active' ? 'Khóa ví' : 'Mở khóa ví'} aria-label={pocket.status === 'active' ? 'Khóa ví' : 'Mở khóa ví'} onClick={() => changeStatus(pocket)}>{pocket.status === 'active' ? <LockKeyhole size={17} /> : <ShieldCheck size={17} />}</button></div></td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
            <OperationsPagination {...result.pagination} onPageChange={(page) => updateFilters({ page }, false)} onPageSizeChange={(pageSize) => updateFilters({ pageSize })} />
          </>
        )}
      </section>
    </main>
  )
}
