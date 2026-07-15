import { zodResolver } from '@hookform/resolvers/zod'
import type { FormEvent, ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Provider } from '../types'

const codePattern = /^[A-Z0-9][A-Z0-9_-]{1,49}$/
const serviceCodePattern = /^[A-Z0-9][A-Z0-9_-]{1,99}$/
const typePattern = /^[a-z][a-z0-9_-]{1,49}$/
const categoryPattern = /^$|^[a-z0-9][a-z0-9_-]{0,49}$/

const optionalUrl = z.string().trim().max(2048, 'URL không quá 2048 ký tự').refine(
  (value) => !value || /^https?:\/\/[^\s]+$/i.test(value),
  'Nhập URL đầy đủ bắt đầu bằng http:// hoặc https://',
)

export const providerFormSchema = z.object({
  type: z.string().trim().min(1, 'Chọn hoặc nhập loại Provider').regex(typePattern, 'Dùng chữ thường, số, gạch ngang hoặc gạch dưới'),
  providerCode: z.string().trim().min(2, 'Mã Provider cần ít nhất 2 ký tự').regex(codePattern, 'Dùng chữ in hoa, số, gạch ngang hoặc gạch dưới'),
  serviceCode: z.string().trim().min(2, 'Nhập mã dịch vụ').regex(serviceCodePattern, 'Mã dịch vụ chưa đúng định dạng'),
  name: z.string().trim().min(2, 'Tên cần ít nhất 2 ký tự').max(100, 'Tên không quá 100 ký tự'),
  category: z.string().trim().regex(categoryPattern, 'Danh mục chỉ dùng chữ thường, số, gạch ngang hoặc gạch dưới'),
  requestUrl: optionalUrl,
  confirmUrl: optionalUrl,
  verifyUrl: optionalUrl,
  currency: z.string().trim().regex(/^[A-Z]{3}$/, 'Mã tiền tệ gồm 3 chữ in hoa'),
  balance: z.number().int('Số dư phải là số nguyên').min(0, 'Số dư không được âm').max(Number.MAX_SAFE_INTEGER, 'Số dư vượt quá giới hạn cho phép'),
  pocketName: z.string().trim().max(100, 'Tên ví không quá 100 ký tự').refine((value) => !value || value.length >= 2, 'Tên ví cần ít nhất 2 ký tự'),
})

export type ProviderFormValues = z.infer<typeof providerFormSchema>

interface Props {
  mode: 'create' | 'edit'
  provider?: Provider
  pending?: boolean
  serverError?: string
  onCancel: () => void
  onSubmit: (values: ProviderFormValues) => void | Promise<void>
}

export function ProviderForm({ mode, provider, pending, serverError, onCancel, onSubmit }: Props) {
  const editing = mode === 'edit'
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      type: provider?.type ?? '',
      providerCode: provider?.code ?? '',
      serviceCode: provider?.serviceCode ?? '',
      name: provider?.name ?? '',
      category: provider?.category ?? '',
      requestUrl: provider?.requestUrl ?? '',
      confirmUrl: provider?.confirmUrl ?? '',
      verifyUrl: provider?.verifyUrl ?? '',
      currency: 'VND',
      balance: 0,
      pocketName: '',
    },
  })

  const errorFor = (name: keyof ProviderFormValues) => errors[name]?.message

  return (
    <form className="provider-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && <div className="provider-alert provider-alert--error" role="alert">{serverError}</div>}

      <section className="provider-card provider-form__section">
        <div className="provider-form__section-heading">
          <span>01</span>
          <div><h2>Thông tin Provider</h2><p>Thông tin nhận diện Provider trong từng dịch vụ.</p></div>
        </div>
        <div className="provider-form__grid">
          <Field label="Mã dịch vụ" required error={errorFor('serviceCode')} hint="Ví dụ: BILL_PAYMENT">
            <input {...register('serviceCode')} autoComplete="off" className="provider-input provider-uppercase" onInput={uppercaseInput} placeholder="BILL_PAYMENT" />
          </Field>
          <Field label="Mã Provider" required error={errorFor('providerCode')} hint="Duy nhất trong dịch vụ đã chọn">
            <input {...register('providerCode')} autoComplete="off" className="provider-input provider-uppercase" onInput={uppercaseInput} placeholder="EVN_HCM" />
          </Field>
          <Field label="Tên hiển thị" required error={errorFor('name')}>
            <input {...register('name')} className="provider-input" placeholder="Điện lực TP. Hồ Chí Minh" />
          </Field>
          <Field label="Loại Provider" required error={errorFor('type')} hint="Chọn gợi ý hoặc nhập loại riêng">
            <input {...register('type')} className="provider-input provider-lowercase" list="provider-types" onInput={lowercaseInput} placeholder="utility" />
            <datalist id="provider-types"><option value="utility" /><option value="bank" /><option value="merchant" /><option value="telco" /><option value="internal" /></datalist>
          </Field>
          <Field label="Danh mục" error={errorFor('category')} hint="Không bắt buộc">
            <input {...register('category')} className="provider-input provider-lowercase" list="provider-categories" onInput={lowercaseInput} placeholder="electricity" />
            <datalist id="provider-categories"><option value="electricity" /><option value="water" /><option value="internet" /><option value="finance" /><option value="telecommunication" /></datalist>
          </Field>
        </div>
      </section>

      <section className="provider-card provider-form__section">
        <div className="provider-form__section-heading">
          <span>02</span>
          <div><h2>Địa chỉ kết nối</h2><p>Các endpoint mà Action của Service có thể tham chiếu.</p></div>
        </div>
        <div className="provider-form__stack">
          <Field label="URL gửi yêu cầu" error={errorFor('requestUrl')} hint="Dùng cho bước request">
            <input {...register('requestUrl')} className="provider-input" inputMode="url" placeholder="https://provider.example.com/payments" />
          </Field>
          <Field label="URL xác nhận" error={errorFor('confirmUrl')} hint="Dùng khi giao dịch cần confirm">
            <input {...register('confirmUrl')} className="provider-input" inputMode="url" placeholder="https://provider.example.com/confirm" />
          </Field>
          <Field label="URL kiểm tra" error={errorFor('verifyUrl')} hint="Dùng để verify trạng thái giao dịch">
            <input {...register('verifyUrl')} className="provider-input" inputMode="url" placeholder="https://provider.example.com/status" />
          </Field>
        </div>
      </section>

      {!editing && (
        <section className="provider-card provider-form__section">
          <div className="provider-form__section-heading">
            <span>03</span>
            <div><h2>Ví Provider</h2><p>Ví được tạo cùng Provider và không thể sửa từ màn này.</p></div>
          </div>
          <div className="provider-form__grid">
            <Field label="Loại tiền" required error={errorFor('currency')} hint="Mặc định VND">
              <input {...register('currency')} className="provider-input provider-uppercase" maxLength={3} onInput={uppercaseInput} />
            </Field>
            <Field label="Số dư ban đầu" required error={errorFor('balance')} hint="Nhập theo đơn vị nhỏ nhất của tiền tệ">
              <input {...register('balance', { valueAsNumber: true })} className="provider-input" min={0} step={1} type="number" />
            </Field>
            <Field label="Tên ví" error={errorFor('pocketName')} hint="Để trống để dùng tên Provider + Wallet">
              <input {...register('pocketName')} className="provider-input" placeholder="Ví thu hộ EVN HCM" />
            </Field>
          </div>
        </section>
      )}

      {editing && (
        <div className="provider-alert provider-alert--info">
          Số dư, loại tiền và tên ví không thay đổi khi cập nhật Provider. Xem thông tin ví ở trang chi tiết.
        </div>
      )}

      <div className="provider-form__actions">
        <button className="provider-button provider-button--secondary" disabled={pending} onClick={onCancel} type="button">Hủy</button>
        <button className="provider-button" disabled={pending || (editing && !isDirty)} type="submit">
          {pending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo Provider'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className={`provider-field ${error ? 'provider-field--error' : ''}`}>
      <span className="provider-field__label">{label}{required && <b aria-label="bắt buộc"> *</b>}</span>
      {children}
      {error ? <small className="provider-field__error">{error}</small> : hint && <small>{hint}</small>}
    </label>
  )
}

function uppercaseInput(event: FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.toUpperCase()
}

function lowercaseInput(event: FormEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.toLowerCase().replace(/\s+/g, '-')
}
