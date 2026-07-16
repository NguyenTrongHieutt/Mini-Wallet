import type { ProviderPocket } from '../types'
import { currencyCode, formatBalance } from '../utils'

export function ProviderPocketCard({ pocket }: { pocket: ProviderPocket | null }) {
  if (!pocket) {
    return (
      <section className="provider-card provider-pocket provider-pocket--empty">
        <div>
          <p className="provider-card__eyebrow">Ví Provider</p>
          <h2>Chưa có thông tin ví</h2>
        </div>
        <p>Provider này chưa được liên kết với ví. Dữ liệu giao dịch sẽ chưa thể ghi nhận.</p>
      </section>
    )
  }

  return (
    <section className="provider-card provider-pocket">
      <div className="provider-pocket__heading">
        <div>
          <p className="provider-card__eyebrow">Ví Provider</p>
          <h2>{pocket.name}</h2>
        </div>
        <span className={`provider-pocket__status provider-pocket__status--${pocket.status}`}>
          {pocket.status === 'active' ? 'Sẵn sàng' : 'Đang khóa'}
        </span>
      </div>
      <div className="provider-pocket__balance">
        <span>Số dư hiện tại</span>
        <strong>{formatBalance(pocket.balance, pocket.currency)}</strong>
        <small>{currencyCode(pocket.currency)} · Số dư lưu theo đơn vị nhỏ nhất</small>
      </div>
      <dl className="provider-details provider-details--compact">
        <div><dt>Mã ví</dt><dd>{pocket.id}</dd></div>
        <div><dt>Chủ sở hữu</dt><dd>{pocket.ownerId}</dd></div>
      </dl>
      <p className="provider-hint">Thông tin ví chỉ đọc tại đây. Cập nhật Provider không làm thay đổi số dư hoặc loại tiền.</p>
    </section>
  )
}

