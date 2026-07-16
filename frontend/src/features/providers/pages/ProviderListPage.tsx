import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useChangeProviderStatus, useProviders } from '../api/providerQueries'
import { providerErrorMessage } from '../api/providerApi'
import { ConfirmProviderStatusDialog } from '../components/ConfirmProviderStatusDialog'
import { ProviderErrorState, ProviderLoading, ProviderPage } from '../components/ProviderPage'
import { ProviderStatusBadge } from '../components/ProviderStatusBadge'
import { appConfig } from '@/config/app-config'
import { formatNumber } from '@/shared/formatters'
import { paginationFromSearch } from '@/shared/url-query'
import type { Provider, ProviderFilters, ProviderSortField, ProviderStatus } from '../types'
import { formatDate } from '../utils'

export function ProviderListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => filtersFromSearch(searchParams), [searchParams])
  const [draft, setDraft] = useState(() => draftFromFilters(filters))
  const [statusTarget, setStatusTarget] = useState<Provider | null>(null)
  const listQuery = useProviders(filters)
  const statusMutation = useChangeProviderStatus()

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    updateSearch(setSearchParams, { ...draft, page: 1 })
  }

  function clearFilters() {
    const empty = { q: '', serviceCode: '', providerCode: '', type: '', category: '', status: '' }
    setDraft(empty)
    setSearchParams({ page: '1', pageSize: String(appConfig.pagination.defaultPageSize) })
  }

  function changeSort(sortBy: ProviderSortField) {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC'
    updateSearch(setSearchParams, { ...filters, sortBy, sortOrder, page: 1 })
  }

  async function confirmStatus() {
    if (!statusTarget) return
    await statusMutation.mutateAsync({
      providerId: statusTarget.id,
      status: statusTarget.status === 'active' ? 'inactive' : 'active',
    })
    setStatusTarget(null)
  }

  const result = listQuery.data
  const hasFilters = Object.values(draft).some(Boolean)

  return (
    <ProviderPage
      title="Provider"
      description="Quản lý đơn vị kết nối và ví thu hộ theo từng dịch vụ."
      actions={<Link className="provider-button" to="/providers/new"><span aria-hidden="true">＋</span> Tạo Provider</Link>}
    >
      <form className="provider-card provider-filters" onSubmit={applyFilters}>
        <div className="provider-filters__search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Tìm Provider"
            onChange={(event) => setDraft({ ...draft, q: event.target.value })}
            placeholder="Tìm theo mã, tên, dịch vụ, loại…"
            value={draft.q}
          />
        </div>
        <div className="provider-filters__grid">
          <label><span>Dịch vụ</span><input className="provider-input provider-uppercase" onChange={(event) => setDraft({ ...draft, serviceCode: event.target.value.toUpperCase() })} placeholder="Tất cả dịch vụ" value={draft.serviceCode} /></label>
          <label><span>Mã Provider</span><input className="provider-input provider-uppercase" onChange={(event) => setDraft({ ...draft, providerCode: event.target.value.toUpperCase() })} placeholder="Tất cả mã" value={draft.providerCode} /></label>
          <label><span>Loại</span><input className="provider-input provider-lowercase" onChange={(event) => setDraft({ ...draft, type: event.target.value.toLowerCase() })} placeholder="Tất cả loại" value={draft.type} /></label>
          <label><span>Danh mục</span><input className="provider-input provider-lowercase" onChange={(event) => setDraft({ ...draft, category: event.target.value.toLowerCase() })} placeholder="Tất cả danh mục" value={draft.category} /></label>
          <label>
            <span>Trạng thái</span>
            <select className="provider-input" onChange={(event) => setDraft({ ...draft, status: event.target.value })} value={draft.status}>
              <option value="">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Ngừng hoạt động</option>
            </select>
          </label>
        </div>
        <div className="provider-filters__actions">
          {hasFilters && <button className="provider-button provider-button--ghost" onClick={clearFilters} type="button">Xóa bộ lọc</button>}
          <button className="provider-button provider-button--secondary" type="submit">Áp dụng</button>
        </div>
      </form>

      {listQuery.isPending && <ProviderLoading label="Đang tải danh sách Provider…" />}
      {listQuery.isError && <ProviderErrorState message={providerErrorMessage(listQuery.error)} onRetry={() => void listQuery.refetch()} />}
      {result && (
        <section className="provider-card provider-list-card">
          <div className="provider-list-card__summary">
            <strong>{formatNumber(result.pagination.total)} Provider</strong>
            <label>
              Hiển thị
              <select
                onChange={(event) => updateSearch(setSearchParams, { ...filters, pageSize: Number(event.target.value), page: 1 })}
                value={filters.pageSize}
              >
                <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
              </select>
            </label>
          </div>
          {result.items.length === 0 ? (
            <div className="provider-empty">
              <div aria-hidden="true">⌕</div>
              <h2>Chưa tìm thấy Provider</h2>
              <p>Thử thay đổi bộ lọc hoặc tạo Provider đầu tiên.</p>
              <Link className="provider-button provider-button--secondary" to="/providers/new">Tạo Provider</Link>
            </div>
          ) : (
            <div className="provider-table-wrap">
              <table className="provider-table">
                <thead><tr>
                  <SortableHeader field="code" filters={filters} label="Provider" onSort={changeSort} />
                  <SortableHeader field="serviceCode" filters={filters} label="Dịch vụ" onSort={changeSort} />
                  <SortableHeader field="type" filters={filters} label="Phân loại" onSort={changeSort} />
                  <SortableHeader field="status" filters={filters} label="Trạng thái" onSort={changeSort} />
                  <SortableHeader field="updatedAt" filters={filters} label="Cập nhật" onSort={changeSort} />
                  <th><span className="provider-sr-only">Thao tác</span></th>
                </tr></thead>
                <tbody>{result.items.map((provider) => (
                  <tr key={provider.id}>
                    <td data-label="Provider"><Link className="provider-table__primary" to={`/providers/${provider.id}`}>{provider.name}</Link><small>{provider.code}</small></td>
                    <td data-label="Dịch vụ"><span className="provider-code">{provider.serviceCode}</span></td>
                    <td data-label="Phân loại"><span>{provider.type}</span><small>{provider.category || 'Chưa phân loại'}</small></td>
                    <td data-label="Trạng thái"><ProviderStatusBadge status={provider.status} /></td>
                    <td data-label="Cập nhật"><span>{formatDate(provider.updatedAt)}</span></td>
                    <td className="provider-table__actions">
                      <Link aria-label={`Xem ${provider.name}`} className="provider-icon-button" to={`/providers/${provider.id}`}>→</Link>
                      <button aria-label={provider.status === 'active' ? `Ngừng ${provider.name}` : `Kích hoạt ${provider.name}`} className="provider-icon-button" onClick={() => setStatusTarget(provider)} type="button">⋯</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {result.pagination.totalPages > 1 && (
            <nav aria-label="Phân trang Provider" className="provider-pagination">
              <button disabled={filters.page <= 1} onClick={() => updateSearch(setSearchParams, { ...filters, page: filters.page - 1 })} type="button">← Trước</button>
              <span>Trang <strong>{filters.page}</strong> / {result.pagination.totalPages}</span>
              <button disabled={filters.page >= result.pagination.totalPages} onClick={() => updateSearch(setSearchParams, { ...filters, page: filters.page + 1 })} type="button">Sau →</button>
            </nav>
          )}
        </section>
      )}

      {statusTarget && (
        <ConfirmProviderStatusDialog
          error={statusMutation.isError ? providerErrorMessage(statusMutation.error) : undefined}
          onCancel={() => { setStatusTarget(null); statusMutation.reset() }}
          onConfirm={() => void confirmStatus()}
          open
          pending={statusMutation.isPending}
          provider={statusTarget}
        />
      )}
    </ProviderPage>
  )
}

type DraftFilters = { q: string; serviceCode: string; providerCode: string; type: string; category: string; status: string }

function draftFromFilters(filters: ProviderFilters): DraftFilters {
  return { q: filters.q ?? '', serviceCode: filters.serviceCode ?? '', providerCode: filters.providerCode ?? '', type: filters.type ?? '', category: filters.category ?? '', status: filters.status ?? '' }
}

function filtersFromSearch(params: URLSearchParams): ProviderFilters {
  const status = params.get('status')
  const sortOrder = params.get('sortOrder')
  const normalizedStatus: ProviderStatus | undefined = status === 'active' || status === 'inactive' ? status : undefined
  const pagination = paginationFromSearch(params)
  return {
    ...pagination,
    q: params.get('q') || undefined,
    serviceCode: params.get('serviceCode') || undefined,
    providerCode: params.get('providerCode') || undefined,
    type: params.get('type') || undefined,
    category: params.get('category') || undefined,
    status: normalizedStatus,
    sortBy: (params.get('sortBy') || 'createdAt') as ProviderSortField,
    sortOrder: sortOrder === 'ASC' ? 'ASC' : 'DESC',
  }
}

function updateSearch(setter: ReturnType<typeof useSearchParams>[1], values: Record<string, unknown>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  setter(params)
}

function SortableHeader({ field, filters, label, onSort }: { field: ProviderSortField; filters: ProviderFilters; label: string; onSort: (field: ProviderSortField) => void }) {
  const active = filters.sortBy === field
  return <th><button className={active ? 'is-active' : ''} onClick={() => onSort(field)} type="button">{label} <span aria-hidden="true">{active ? filters.sortOrder === 'ASC' ? '↑' : '↓' : '↕'}</span></button></th>
}
