import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OperationsPaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function OperationsPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: OperationsPaginationProps) {
  if (total === 0) return null
  const safeTotalPages = Math.max(totalPages, 1)
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <div className="ops-pagination" aria-label="Phân trang">
      <span className="ops-pagination__summary">
        Hiển thị {first}–{last} trong {total}
      </span>
      <label className="ops-page-size">
        <span>Mỗi trang</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Số dòng mỗi trang"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </label>
      <div className="ops-pagination__controls">
        <button
          className="ops-icon-button"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft size={18} />
        </button>
        <span>Trang {page}/{safeTotalPages}</span>
        <button
          className="ops-icon-button"
          type="button"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
