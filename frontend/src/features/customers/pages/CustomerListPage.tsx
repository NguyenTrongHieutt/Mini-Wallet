import { useMemo, useState } from 'react'
import { AlertCircle, Eye, RefreshCw, Search, ShieldBan, ShieldCheck, Users } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useChangeCustomerStatus, useCustomers } from '../api/customerQueries'
import { customerErrorMessage } from '../api/customerApi'
import { CustomerStatusBadge } from '../components/CustomerStatusBadge'
import { OperationsPagination } from '@/features/pockets/components/OperationsPagination'
import { formatDate } from '@/features/pockets/utils'
import { paginationFromSearch } from '@/shared/url-query'
import type { CustomerFilters, CustomerSortField, CustomerStatus } from '../types'
import '@/features/pockets/operations.css'

const VALID_SORTS: CustomerSortField[] = ['phone', 'displayName', 'status', 'createdAt', 'updatedAt']

export function CustomerListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [searchDraft, setSearchDraft] = useState(q)
  const [notice, setNotice] = useState<string | null>(null)

  const filters = useMemo<CustomerFilters>(() => {
    const statusParam = searchParams.get('status')
    const sortParam = searchParams.get('sortBy') as CustomerSortField | null
    const pagination = paginationFromSearch(searchParams)
    return {
      ...pagination,
      q: q || undefined,
      status: statusParam === 'active' || statusParam === 'locked' ? statusParam : undefined,
      sortBy: sortParam && VALID_SORTS.includes(sortParam) ? sortParam : 'createdAt',
      sortOrder: searchParams.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC',
    }
  }, [q, searchParams])

  const customersQuery = useCustomers(filters)
  const statusMutation = useChangeCustomerStatus()

  function updateFilters(values: Record<string, string | number | undefined>, resetPage = true) {
    const next = new URLSearchParams(searchParams)
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, String(value))
    })
    if (resetPage) next.set('page', '1')
    setSearchParams(next)
  }

  async function changeStatus(customerId: string, currentStatus: CustomerStatus, displayName?: string | null) {
    const targetStatus: CustomerStatus = currentStatus === 'active' ? 'locked' : 'active'
    const action = targetStatus === 'locked' ? 'khóa' : 'mở khóa'
    const subject = displayName || 'khách hàng này'
    const extra = targetStatus === 'locked' ? '\nCác phiên đăng nhập hiện tại của khách hàng sẽ bị thu hồi.' : ''
    if (!window.confirm(`Bạn có chắc muốn ${action} ${subject}?${extra}`)) return

    setNotice(null)
    try {
      const result = await statusMutation.mutateAsync({ customerId, status: targetStatus })
      setNotice(result.changed ? `Đã ${action} khách hàng thành công.` : `Khách hàng đã ở trạng thái mong muốn.`)
    } catch {
      // Mutation error is rendered below.
    }
  }

  const result = customersQuery.data

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-eyebrow">Vận hành người dùng</p>
          <h1 className="ops-title">Khách hàng</h1>
          <p className="ops-subtitle">Tra cứu hồ sơ, xem các ví đang sở hữu và kiểm soát quyền truy cập.</p>
        </div>
        <button className="ops-button ops-button--secondary" type="button" onClick={() => customersQuery.refetch()} disabled={customersQuery.isFetching}>
          <RefreshCw size={17} aria-hidden="true" /> Làm mới
        </button>
      </header>

      <form
        className="ops-panel ops-filter-panel"
        onSubmit={(event) => {
          event.preventDefault()
          updateFilters({ q: searchDraft.trim() })
        }}
      >
        <div className="ops-filter-grid ops-filter-grid--customer">
          <label className="ops-field">
            <span>Tìm khách hàng</span>
            <span className="ops-search-wrap">
              <Search size={17} aria-hidden="true" />
              <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Tên hiển thị hoặc số điện thoại" />
            </span>
          </label>
          <label className="ops-field">
            <span>Trạng thái</span>
            <select value={filters.status ?? ''} onChange={(event) => updateFilters({ status: event.target.value })}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </label>
          <label className="ops-field">
            <span>Sắp xếp</span>
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':')
                updateFilters({ sortBy, sortOrder })
              }}
            >
              <option value="createdAt:DESC">Mới tạo gần đây</option>
              <option value="createdAt:ASC">Tạo lâu nhất</option>
              <option value="displayName:ASC">Tên A–Z</option>
              <option value="phone:ASC">Số điện thoại tăng dần</option>
              <option value="updatedAt:DESC">Mới cập nhật</option>
            </select>
          </label>
          <div className="ops-filter-actions">
            <button className="ops-button ops-button--primary" type="submit">Tìm kiếm</button>
            <button
              className="ops-button ops-button--secondary"
              type="button"
              onClick={() => {
                setSearchDraft('')
                setSearchParams(new URLSearchParams())
              }}
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </form>

      {notice && <div className="ops-alert ops-alert--info" role="status"><ShieldCheck size={18} /><div>{notice}</div></div>}
      {statusMutation.isError && <div className="ops-alert ops-alert--error" role="alert"><AlertCircle size={18} /><div>{customerErrorMessage(statusMutation.error)}</div></div>}

      <section className="ops-panel" aria-label="Danh sách khách hàng">
        {customersQuery.isLoading ? (
          <div className="ops-state"><div className="ops-spinner" /><h2>Đang tải khách hàng</h2><p>Dữ liệu đang được đồng bộ từ hệ thống.</p></div>
        ) : customersQuery.isError ? (
          <div className="ops-state"><AlertCircle size={34} /><h2>Chưa tải được danh sách</h2><p>{customerErrorMessage(customersQuery.error)}</p><button className="ops-button ops-button--secondary" onClick={() => customersQuery.refetch()}>Thử lại</button></div>
        ) : !result?.items.length ? (
          <div className="ops-state"><Users size={36} /><h2>Không tìm thấy khách hàng</h2><p>Hãy thử từ khóa khác hoặc xóa bớt điều kiện lọc.</p></div>
        ) : (
          <>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Trạng thái</th><th>Ngày tham gia</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
                <tbody>
                  {result.items.map((customer) => (
                    <tr key={customer.id}>
                      <td><div className="ops-table__primary">{customer.displayName || 'Chưa đặt tên'}</div><div className="ops-table__secondary">ID: {customer.id}</div></td>
                      <td className="ops-table__primary">{customer.phone}</td>
                      <td><CustomerStatusBadge status={customer.status} /></td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td>
                        <div className="ops-table__actions">
                          <Link className="ops-icon-button" to={`/customers/${customer.id}`} title="Xem chi tiết" aria-label={`Xem ${customer.displayName || customer.phone}`}><Eye size={17} /></Link>
                          <button
                            className="ops-icon-button"
                            type="button"
                            title={customer.status === 'active' ? 'Khóa khách hàng' : 'Mở khóa khách hàng'}
                            aria-label={customer.status === 'active' ? 'Khóa khách hàng' : 'Mở khóa khách hàng'}
                            disabled={statusMutation.isPending}
                            onClick={() => changeStatus(customer.id, customer.status, customer.displayName)}
                          >
                            {customer.status === 'active' ? <ShieldBan size={17} /> : <ShieldCheck size={17} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <OperationsPagination
              {...result.pagination}
              onPageChange={(page) => updateFilters({ page }, false)}
              onPageSizeChange={(pageSize) => updateFilters({ pageSize })}
            />
          </>
        )}
      </section>
    </main>
  )
}
