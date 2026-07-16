import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { serviceApi } from './api'

const statusLabel = { draft: 'Bản nháp', active: 'Đang hoạt động', inactive: 'Đã tắt' }

export function ServiceListPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const query = useQuery({
    queryKey: ['services', { q, status, page }],
    queryFn: () => serviceApi.list({ q, status: status || undefined, page, pageSize: 12, sortBy: 'updatedAt', sortOrder: 'DESC' }),
  })

  return (
    <section className="page-stack">
      <header className="page-heading">
        <div><p className="eyebrow">Cấu hình nghiệp vụ</p><h1>Dịch vụ</h1><p>Tạo và vận hành các luồng giao dịch mà không cần sửa code.</p></div>
        <Link className="button primary" to="/services/new">Tạo dịch vụ</Link>
      </header>
      <div className="toolbar panel">
        <input aria-label="Tìm dịch vụ" placeholder="Tìm theo tên, mã hoặc mô tả" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <select aria-label="Trạng thái" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Mọi trạng thái</option><option value="draft">Bản nháp</option><option value="active">Đang hoạt động</option><option value="inactive">Đã tắt</option>
        </select>
      </div>
      {query.isLoading && <div className="panel empty-state">Đang tải danh sách dịch vụ…</div>}
      {query.error && <div className="alert error">{query.error instanceof Error ? query.error.message : 'Không tải được dữ liệu'}</div>}
      <div className="card-grid">
        {query.data?.items.map((service) => (
          <Link className="entity-card" key={service.id} to={`/services/${service.id}/config/basic`}>
            <div className="entity-card-top"><code>{service.code}</code><span className={`badge ${service.status}`}>{statusLabel[service.status]}</span></div>
            <h2>{service.name}</h2><p>{service.description || 'Chưa có mô tả'}</p>
            <div className="entity-meta"><span>{service.fieldBuilder.length} biến runtime</span><span>{service.auth.method === 'PIN' ? 'Xác thực PIN' : 'Không cần PIN'}</span></div>
          </Link>
        ))}
      </div>
      {!query.isLoading && !query.data?.items.length && <div className="panel empty-state"><h2>Chưa có dịch vụ phù hợp</h2><p>Thử thay đổi bộ lọc hoặc tạo một bản nháp mới.</p></div>}
      {(query.data?.pagination.totalPages ?? 0) > 1 && <nav className="pagination"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trang trước</button><span>Trang {page}/{query.data?.pagination.totalPages}</span><button disabled={page >= (query.data?.pagination.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Trang sau</button></nav>}
    </section>
  )
}

