import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { appConfig } from '@/config/app-config'
import { operationErrorMessage } from './api'
import { JsonDetails } from './components'
import { useTriggerTransaction } from './hooks'
import type { CashInPayload } from './types'
import './operations.css'

const SERVICE_CODE = 'CASH_IN' as const

export function TriggerTransactionPage() {
  const [customerPhone, setCustomerPhone] = useState('')
  const [amount, setAmount] = useState('50000')
  const [currency, setCurrency] = useState(appConfig.defaultCurrency)
  const [message, setMessage] = useState('Postman local cash-in')
  const [localError, setLocalError] = useState<string | null>(null)
  const trigger = useTriggerTransaction()

  const payloadPreview = useMemo<CashInPayload>(() => ({
    serviceCode: SERVICE_CODE,
    customerPhone: customerPhone.trim() || '*{{customerPhone}}*',
    amount: Number(amount) || 0,
    currency: currency.trim().toUpperCase() || appConfig.defaultCurrency,
    message: message.trim(),
  }), [amount, currency, customerPhone, message])

  function buildPayload(): CashInPayload {
    const normalizedPhone = customerPhone.trim()
    const normalizedAmount = Number(amount)
    const normalizedCurrency = currency.trim().toUpperCase()
    const normalizedMessage = message.trim()

    if (!normalizedPhone) throw new Error('Vui lòng nhập số điện thoại khách hàng.')
    if (!Number.isSafeInteger(normalizedAmount) || normalizedAmount <= 0) throw new Error('Số tiền cash-in phải là số nguyên lớn hơn 0.')
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) throw new Error('Loại tiền phải gồm đúng 3 chữ cái, ví dụ VND.')
    if (!normalizedMessage) throw new Error('Vui lòng nhập nội dung giao dịch.')

    return {
      serviceCode: SERVICE_CODE,
      customerPhone: normalizedPhone,
      amount: normalizedAmount,
      currency: normalizedCurrency,
      message: normalizedMessage,
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLocalError(null)

    let payload: CashInPayload
    try {
      payload = buildPayload()
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Dữ liệu cash-in chưa hợp lệ.')
      return
    }

    if (!window.confirm(`Nạp ${payload.amount.toLocaleString(appConfig.locale)} ${payload.currency} cho khách hàng ${payload.customerPhone}?`)) return
    try {
      await trigger.mutateAsync(payload)
    } catch {
      // Lỗi API được hiển thị bên dưới.
    }
  }

  return <main className="monitor-page">
    <header className="monitor-header">
      <div>
        <p className="monitor-eyebrow">Công cụ vận hành</p>
        <h1 className="monitor-title">Cash-in</h1>
        <p className="monitor-subtitle">Nạp tiền vào ví khách hàng bằng Service CASH_IN.</p>
      </div>
    </header>

    {(localError || trigger.isError) && <div className="monitor-alert monitor-alert--error" role="alert">
      <AlertCircle size={19}/>
      <div>{localError ?? operationErrorMessage(trigger.error)}</div>
    </div>}

    <form className="monitor-panel" onSubmit={submit}>
      <div className="monitor-form-grid">
        <label className="monitor-field">
          <span>Mã dịch vụ</span>
          <input value={SERVICE_CODE} readOnly aria-readonly="true"/>
          <small>Màn hình này chỉ chạy nghiệp vụ Cash-in.</small>
        </label>

        <label className="monitor-field">
          <span>Số điện thoại khách hàng <strong>*</strong></span>
          <input type="tel" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="0912345678" autoComplete="tel"/>
          <small>Trong Postman có thể dùng *{'{{customerPhone}}'}*; trên giao diện cần nhập số điện thoại thực tế.</small>
        </label>

        <label className="monitor-field">
          <span>Số tiền <strong>*</strong></span>
          <input type="number" required min="1" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)}/>
        </label>

        <label className="monitor-field">
          <span>Loại tiền <strong>*</strong></span>
          <input required maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder={appConfig.defaultCurrency}/>
        </label>

        <label className="monitor-field monitor-field--span-2">
          <span>Nội dung giao dịch <strong>*</strong></span>
          <textarea required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Postman local cash-in"/>
        </label>
      </div>

      <div className="monitor-form-section">
        <h2>Body gửi lên API</h2>
        <p>Request chỉ chứa đúng năm trường của nghiệp vụ Cash-in.</p>
        <JsonDetails title="Xem JSON body" value={payloadPreview}/>
      </div>

      <div className="monitor-filter-actions" style={{ marginTop: 20 }}>
        <button className="monitor-button monitor-button--primary" type="submit" disabled={trigger.isPending}>
          <Play size={17}/>{trigger.isPending ? 'Đang chạy Cash-in…' : 'Chạy Cash-in'}
        </button>
      </div>
    </form>

    {trigger.data && <section className="monitor-panel monitor-trigger-result">
      <div className="monitor-alert monitor-alert--success">
        <CheckCircle2 size={20}/>
        <div>
          <strong>Cash-in đã hoàn tất quy trình</strong>
          <div style={{ marginTop: 6 }}>Mã tham chiếu: <span className="monitor-ref">{trigger.data.transRefId}</span></div>
        </div>
      </div>
      <div className="monitor-header__actions">
        <Link className="monitor-link-button monitor-link-button--secondary" to={`/trails/${trigger.data.transRefId}`}>Mở Trail <ArrowRight size={16}/></Link>
        <Link className="monitor-link-button monitor-link-button--secondary" to={`/transactions?transRefId=${encodeURIComponent(trigger.data.transRefId)}`}>Tìm giao dịch <ArrowRight size={16}/></Link>
        <Link className="monitor-link-button monitor-link-button--secondary" to={`/ledger/entries?transRefId=${encodeURIComponent(trigger.data.transRefId)}`}>Xem bút toán <ArrowRight size={16}/></Link>
      </div>
      <JsonDetails title="Kết quả request / confirm / verify" value={trigger.data}/>
    </section>}
  </main>
}
