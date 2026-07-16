import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { validationCatalog } from '../catalogs'
import { serviceApi } from '../api'
import type { Service, TransValidation } from '../types'

type ValidationForm = { validateFunc: string; validateFields: string; errorCode: string; order: number | null; status: 'active' | 'inactive' }
const initial: ValidationForm = { validateFunc: validationCatalog[0].value, validateFields: validationCatalog[0].defaultFields, errorCode: 'VALIDATION_FAILED', order: null, status: 'active' }

export function ValidationsSection({ service, readOnly }: { service: Service; readOnly: boolean }) {
  const client = useQueryClient()
  const [form, setForm] = useState<ValidationForm>(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['serviceValidations', service.id], queryFn: () => serviceApi.listValidations(service.id) })
  const reset = () => { setForm(initial); setEditingId(null) }
  const mutation = useMutation({
    mutationFn: () => {
      if (form.validateFields.trim().startsWith('{')) {
        const parsed: unknown = JSON.parse(form.validateFields)
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Cấu hình validation phải là một đối tượng JSON.')
      }
      const body = { ...form, validateFields: form.validateFields.trim(), errorCode: form.errorCode.trim().toUpperCase() || undefined, order: form.order ?? (query.data?.items.length ?? 0) + 1 }
      return editingId
        ? serviceApi.updateValidation(service.id, editingId, body)
        : serviceApi.insertValidation(service.id, body)
    },
    onSuccess: () => { reset(); void client.invalidateQueries({ queryKey: ['serviceValidations', service.id] }) },
  })
  const toggle = useMutation({ mutationFn: (item: TransValidation) => serviceApi.updateValidation(service.id, item.id, { status: item.status === 'active' ? 'inactive' : 'active' }), onSuccess: () => client.invalidateQueries({ queryKey: ['serviceValidations', service.id] }) })
  const choose = (value: string) => { const entry = validationCatalog.find((option) => option.value === value); setForm({ ...form, validateFunc: value, validateFields: entry?.defaultFields ?? '' }) }
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate() }
  return <div className="section-stack"><header className="section-heading"><div><h2>Kiểm tra nghiệp vụ</h2><p>Chọn quy tắc bằng ngôn ngữ gần gũi; hệ thống lưu tên hàm validator canonical tương ứng.</p></div></header>
    {!readOnly && <form className="panel form-stack" onSubmit={submit}><h3>{editingId ? 'Cập nhật quy tắc' : 'Thêm quy tắc'}</h3><label>Quy tắc<select value={form.validateFunc} onChange={(e) => choose(e.target.value)}>{validationCatalog.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select></label><label>{form.validateFunc === 'validateRole' ? 'Cấu hình vai trò (JSON)' : 'Các biến tham gia'}<input required value={form.validateFields} onChange={(e) => setForm({ ...form, validateFields: e.target.value })}/><small>{form.validateFunc === 'validateRole' ? 'Ví dụ: {"field":"USERROLE","allowed":["officer"]}' : 'Các tên biến được nối bằng dấu hai chấm.'}</small></label><label>Mã lỗi hiển thị<input value={form.errorCode} onChange={(e) => setForm({ ...form, errorCode: e.target.value.toUpperCase() })}/></label>{mutation.error && <div className="alert error">{mutation.error instanceof SyntaxError ? 'JSON cấu hình validation chưa hợp lệ.' : mutation.error instanceof Error ? mutation.error.message : 'Không lưu được quy tắc'}</div>}<div className="form-actions">{editingId && <button className="button secondary" type="button" onClick={reset}>Hủy chỉnh sửa</button>}<button className="button primary" disabled={mutation.isPending}>{mutation.isPending ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Thêm quy tắc'}</button></div></form>}
    {query.error && <div className="alert error">{query.error instanceof Error ? query.error.message : 'Không tải được validation.'}</div>}
    {toggle.error && <div className="alert error">{toggle.error instanceof Error ? toggle.error.message : 'Không đổi được trạng thái validation.'}</div>}
    <div className="stack-list">{query.data?.items.map((item) => { const catalog = validationCatalog.find((entry) => entry.value === item.validateFunc); return <article className="panel list-card" key={item.id}><div><span className="order-chip">{item.order}</span><strong>{catalog?.label ?? item.validateFunc}</strong><p><code>{item.validateFields}</code></p><small>Mã lỗi: {item.errorCode || 'Mặc định'}</small></div><div className="row-actions"><span className={`badge ${item.status}`}>{item.status === 'active' ? 'Đang dùng' : 'Đã tắt'}</span>{!readOnly && <><button className="button compact ghost" type="button" onClick={() => { setEditingId(item.id); setForm({ validateFunc: item.validateFunc, validateFields: item.validateFields, errorCode: item.errorCode ?? '', order: item.order, status: item.status }) }}>Sửa</button><button className="button compact secondary" type="button" disabled={toggle.isPending} onClick={() => toggle.mutate(item)}>{item.status === 'active' ? 'Tắt' : 'Bật'}</button></>}</div></article> })}{query.isLoading && <div className="panel empty-state">Đang tải…</div>}{!query.isLoading && !query.data?.items.length && <div className="panel empty-state">Chưa có quy tắc nghiệp vụ.</div>}</div>
  </div>
}
