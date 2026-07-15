import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { serviceApi } from '../api'
import type { Service, TransField } from '../types'

type FieldForm = {
  fieldName: string
  fieldFormat: string
  minLength: string
  maxLength: string
  regex: string
  isRequired: boolean
  needSecured: boolean
  errorCode: string
  status: 'active' | 'inactive'
  order: number | null
}

const initial: FieldForm = { fieldName: '', fieldFormat: 'string', minLength: '', maxLength: '', regex: '', isRequired: true, needSecured: false, errorCode: '', status: 'active', order: null }

function toForm(field: TransField): FieldForm {
  return {
    fieldName: field.fieldName,
    fieldFormat: field.fieldFormat,
    minLength: field.minLength == null ? '' : String(field.minLength),
    maxLength: field.maxLength == null ? '' : String(field.maxLength),
    regex: field.regex ?? '',
    isRequired: field.isRequired,
    needSecured: field.needSecured,
    errorCode: field.errorCode ?? '',
    status: field.status,
    order: field.order,
  }
}

export function TransFieldsSection({ service, readOnly }: { service: Service; readOnly: boolean }) {
  const client = useQueryClient()
  const [form, setForm] = useState<FieldForm>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const query = useQuery({ queryKey: ['serviceFields', service.id], queryFn: () => serviceApi.listFields(service.id) })
  const reset = () => { setForm(initial); setEditingId(null); setFormError('') }
  const mutation = useMutation({
    mutationFn: () => {
      const minLength = form.minLength === '' ? undefined : Number(form.minLength)
      const maxLength = form.maxLength === '' ? undefined : Number(form.maxLength)
      if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) throw new Error('Độ dài tối thiểu không được lớn hơn độ dài tối đa.')
      if (form.regex) {
        try { new RegExp(form.regex) } catch { throw new Error('Biểu thức kiểm tra không hợp lệ.') }
      }
      const body = {
        fieldName: form.fieldName.trim().toUpperCase(),
        fieldFormat: form.fieldFormat,
        minLength,
        maxLength,
        regex: form.regex || undefined,
        isRequired: form.isRequired,
        needSecured: form.needSecured,
        errorCode: form.errorCode.trim().toUpperCase() || undefined,
        status: form.status,
        order: form.order ?? (query.data?.items.length ?? 0) + 1,
      }
      return editingId
        ? serviceApi.updateField(service.id, editingId, body)
        : serviceApi.insertField(service.id, body)
    },
    onSuccess: () => { reset(); void client.invalidateQueries({ queryKey: ['serviceFields', service.id] }) },
  })
  const toggle = useMutation({ mutationFn: (field: TransField) => serviceApi.updateField(service.id, field.id, { status: field.status === 'active' ? 'inactive' : 'active' }), onSuccess: () => client.invalidateQueries({ queryKey: ['serviceFields', service.id] }) })
  const submit = (event: FormEvent) => { event.preventDefault(); setFormError(''); mutation.mutate() }
  const error = mutation.error instanceof Error ? mutation.error.message : formError

  return <div className="section-stack"><header className="section-heading"><div><h2>Trường người dùng nhập</h2><p>Quy định dữ liệu đầu vào cần kiểm tra trước khi giao dịch được xử lý. Mỗi trường active phải được tạo ở bước Dựng biến.</p></div></header>
    {!readOnly && <form className="panel form-stack" onSubmit={submit}><h3>{editingId ? 'Cập nhật trường nhập' : 'Thêm trường nhập'}</h3><div className="form-grid"><label>Tên biến<input required pattern="[A-Z][A-Z0-9_]*" placeholder="AMOUNT" value={form.fieldName} onChange={(e) => setForm({ ...form, fieldName: e.target.value.toUpperCase() })}/></label><label>Định dạng<select value={form.fieldFormat} onChange={(e) => setForm({ ...form, fieldFormat: e.target.value })}><option value="string">Văn bản</option><option value="number">Số</option><option value="phone">Số điện thoại</option><option value="boolean">Đúng/Sai</option><option value="object">Đối tượng</option><option value="array">Danh sách</option><option value="json">JSON</option></select></label><label>Độ dài tối thiểu<input type="number" min="0" step="1" value={form.minLength} onChange={(e) => setForm({ ...form, minLength: e.target.value })}/></label><label>Độ dài tối đa<input type="number" min="0" step="1" value={form.maxLength} onChange={(e) => setForm({ ...form, maxLength: e.target.value })}/></label></div><label>Biểu thức kiểm tra (tùy chọn)<input placeholder="Ví dụ: ^\\+?[0-9]{9,15}$" value={form.regex} onChange={(e) => setForm({ ...form, regex: e.target.value })}/></label><div className="check-row"><label><input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}/> Bắt buộc nhập</label><label><input type="checkbox" checked={form.needSecured} onChange={(e) => setForm({ ...form, needSecured: e.target.checked })}/> Che khi hiển thị/log</label></div><label>Mã lỗi<input value={form.errorCode} onChange={(e) => setForm({ ...form, errorCode: e.target.value.toUpperCase() })}/></label>{error && <div className="alert error">{error}</div>}<div className="form-actions">{editingId && <button className="button secondary" type="button" onClick={reset}>Hủy chỉnh sửa</button>}<button className="button primary" disabled={mutation.isPending}>{mutation.isPending ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Thêm trường'}</button></div></form>}
    {query.error && <div className="alert error">{query.error instanceof Error ? query.error.message : 'Không tải được trường nhập.'}</div>}
    {toggle.error && <div className="alert error">{toggle.error instanceof Error ? toggle.error.message : 'Không đổi được trạng thái trường.'}</div>}
    <div className="panel table-wrap"><table><thead><tr><th>Thứ tự</th><th>Trường</th><th>Định dạng</th><th>Yêu cầu</th><th>Bảo mật</th><th>Trạng thái</th><th></th></tr></thead><tbody>{query.data?.items.map((field) => <tr key={field.id}><td>{field.order}</td><td><strong>{field.fieldName}</strong><small>{field.errorCode}</small></td><td>{field.fieldFormat}</td><td>{field.isRequired ? 'Bắt buộc' : 'Tùy chọn'}</td><td>{field.needSecured ? 'Có che' : 'Bình thường'}</td><td><span className={`badge ${field.status}`}>{field.status === 'active' ? 'Đang dùng' : 'Đã tắt'}</span></td><td>{!readOnly && <div className="row-actions"><button className="button compact ghost" type="button" onClick={() => { setEditingId(field.id); setForm(toForm(field)); setFormError('') }}>Sửa</button><button className="button compact secondary" type="button" disabled={toggle.isPending} onClick={() => toggle.mutate(field)}>{field.status === 'active' ? 'Tắt' : 'Bật'}</button></div>}</td></tr>)}</tbody></table>{query.isLoading && <div className="empty-state">Đang tải…</div>}{!query.isLoading && !query.data?.items.length && <div className="empty-state">Chưa có trường nhập nào.</div>}</div>
  </div>
}
