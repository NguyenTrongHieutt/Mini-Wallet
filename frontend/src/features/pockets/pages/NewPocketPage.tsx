import { useState, type FormEvent } from 'react'
import { AlertCircle, ArrowLeft, Building2, Landmark, WalletCards } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { appConfig } from '@/config/app-config'
import { pocketErrorMessage } from '../api/pocketApi'
import { useCreatePocket } from '../api/pocketQueries'
import type { CreatablePocketOwnerType, CreatePocketInput } from '../types'
import '../operations.css'

interface PocketFormState {
  ownerType: CreatablePocketOwnerType
  ownerId: string
  name: string
  currency: string
  balance: string
}

type FormErrors = Partial<Record<keyof PocketFormState, string>>

const INITIAL_FORM: PocketFormState = {
  ownerType: 'system',
  ownerId: '',
  name: '',
  currency: appConfig.defaultCurrency,
  balance: '0',
}

function validate(form: PocketFormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.ownerId.trim()) errors.ownerId = 'Vui lòng nhập mã chủ sở hữu.'
  else if (form.ownerId.trim().length > 100) errors.ownerId = 'Tối đa 100 ký tự.'
  if (form.name.trim().length < 2 || form.name.trim().length > 100) errors.name = 'Tên ví cần có từ 2 đến 100 ký tự.'
  if (!/^[A-Z]{3}$/.test(form.currency)) errors.currency = 'Nhập đúng 3 chữ cái, ví dụ VND.'
  const balance = Number(form.balance)
  if (!/^\d+$/.test(form.balance) || !Number.isSafeInteger(balance) || balance < 0) errors.balance = 'Nhập số nguyên không âm và không vượt giới hạn an toàn.'
  return errors
}

export function NewPocketPage() {
  const navigate = useNavigate()
  const createMutation = useCreatePocket()
  const [form, setForm] = useState<PocketFormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  function setField<K extends keyof PocketFormState>(field: K, value: PocketFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const input: CreatePocketInput = {
      ownerType: form.ownerType,
      ownerId: form.ownerId.trim(),
      name: form.name.trim(),
      currency: form.currency,
      balance: Number(form.balance),
    }
    try {
      const result = await createMutation.mutateAsync(input)
      navigate(`/pockets/${result.pocket.id}`, { replace: true, state: { created: true } })
    } catch {
      // Error is rendered below.
    }
  }

  return (
    <main className="ops-page">
      <header className="ops-header"><div><Link className="ops-link-button ops-link-button--secondary" to="/pockets"><ArrowLeft size={17} /> Danh sách ví</Link><p className="ops-eyebrow" style={{ marginTop: 20 }}>Khởi tạo số dư vận hành</p><h1 className="ops-title">Tạo ví mới</h1><p className="ops-subtitle">Officer chỉ tạo trực tiếp ví cho Hệ thống hoặc Ngân hàng. Ví khách hàng và Provider được tạo trong luồng nghiệp vụ tương ứng.</p></div></header>

      <form className="ops-form" onSubmit={submit} noValidate>
        {createMutation.isError && <div className="ops-alert ops-alert--error" role="alert"><AlertCircle size={18} /><div>{pocketErrorMessage(createMutation.error)}</div></div>}
        <section className="ops-panel ops-form-panel">
          <h2 className="ops-section-title"><WalletCards size={19} /> Thông tin ví</h2>
          <div className="ops-form-grid">
            <fieldset className="ops-field ops-field--wide" style={{ border: 0, padding: 0, margin: 0 }}>
              <span className="ops-label">Ví thuộc về</span>
              <div className="ops-card-list">
                <label className="ops-pocket-card" style={{ cursor: 'pointer', borderColor: form.ownerType === 'system' ? '#6379dd' : undefined }}><input type="radio" name="ownerType" value="system" checked={form.ownerType === 'system'} onChange={() => setField('ownerType', 'system')} style={{ marginRight: 8 }} /><Building2 size={18} style={{ verticalAlign: -4, marginRight: 6 }} /><strong>Hệ thống</strong><div className="ops-field-hint" style={{ marginTop: 7 }}>Ví phí, ví trung gian hoặc ví kỹ thuật nội bộ.</div></label>
                <label className="ops-pocket-card" style={{ cursor: 'pointer', borderColor: form.ownerType === 'bank' ? '#6379dd' : undefined }}><input type="radio" name="ownerType" value="bank" checked={form.ownerType === 'bank'} onChange={() => setField('ownerType', 'bank')} style={{ marginRight: 8 }} /><Landmark size={18} style={{ verticalAlign: -4, marginRight: 6 }} /><strong>Ngân hàng</strong><div className="ops-field-hint" style={{ marginTop: 7 }}>Ví đối soát hoặc đại diện tài khoản ngân hàng.</div></label>
              </div>
            </fieldset>
            <label className="ops-field"><span>Mã chủ sở hữu</span><input value={form.ownerId} onChange={(event) => setField('ownerId', event.target.value)} placeholder={form.ownerType === 'system' ? 'VD: MINI_WALLET_CORE' : 'VD: JITS_BANK'} aria-invalid={Boolean(errors.ownerId)} />{errors.ownerId ? <span className="ops-field-error">{errors.ownerId}</span> : <span className="ops-field-hint">Mã ổn định để nhận diện chủ sở hữu trong định khoản.</span>}</label>
            <label className="ops-field"><span>Tên hiển thị</span><input value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="VD: Ví phí giao dịch" aria-invalid={Boolean(errors.name)} />{errors.name && <span className="ops-field-error">{errors.name}</span>}</label>
            <label className="ops-field"><span>Loại tiền</span><input value={form.currency} maxLength={3} onChange={(event) => setField('currency', event.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder={appConfig.defaultCurrency} aria-invalid={Boolean(errors.currency)} />{errors.currency ? <span className="ops-field-error">{errors.currency}</span> : <span className="ops-field-hint">Mã ISO gồm 3 chữ cái.</span>}</label>
            <label className="ops-field"><span>Số dư ban đầu</span><input value={form.balance} inputMode="numeric" onChange={(event) => setField('balance', event.target.value.replace(/[^0-9]/g, ''))} placeholder="0" aria-invalid={Boolean(errors.balance)} />{errors.balance ? <span className="ops-field-error">{errors.balance}</span> : <span className="ops-field-hint">Nhập theo đơn vị nhỏ nhất mà hệ thống đang lưu; không dùng dấu phân cách.</span>}</label>
          </div>
          <div className="ops-alert ops-alert--info" style={{ marginTop: 22, marginBottom: 0 }}><AlertCircle size={18} /><div><strong>Kiểm tra trước khi tạo</strong><p>Mỗi chủ sở hữu chỉ có một ví cho mỗi loại tiền. Loại chủ sở hữu, mã chủ và loại tiền không thể chỉnh ở màn này sau khi tạo.</p></div></div>
          <footer className="ops-form-footer"><Link className="ops-link-button ops-link-button--secondary" to="/pockets">Hủy</Link><button className="ops-button ops-button--primary" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Đang tạo ví…' : 'Tạo ví'}</button></footer>
        </section>
      </form>
    </main>
  )
}
