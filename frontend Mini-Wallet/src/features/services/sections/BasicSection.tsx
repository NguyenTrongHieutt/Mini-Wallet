import { FormEvent, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceApi } from '../api'
import type { Service } from '../types'

export function BasicSection({ service, readOnly }: { service: Service; readOnly: boolean }) {
  const client = useQueryClient()
  const [form, setForm] = useState({ name: service.name, description: service.description, feeType: service.fee.type, feeValue: String(service.fee.value), min: service.fee.min == null ? '' : String(service.fee.min), max: service.fee.max == null ? '' : String(service.fee.max), auth: service.auth.method })
  useEffect(() => setForm({ name: service.name, description: service.description, feeType: service.fee.type, feeValue: String(service.fee.value), min: service.fee.min == null ? '' : String(service.fee.min), max: service.fee.max == null ? '' : String(service.fee.max), auth: service.auth.method }), [service])
  const mutation = useMutation({ mutationFn: () => serviceApi.update(service.id, { name: form.name.trim(), description: form.description.trim(), fee: { ...service.fee, type: form.feeType, value: Number(form.feeValue), min: form.min === '' ? undefined : Number(form.min), max: form.max === '' ? undefined : Number(form.max) }, auth: { ...service.auth, method: form.auth } }), onSuccess: () => client.invalidateQueries({ queryKey: ['service', service.id] }) })
  const submit = (e: FormEvent) => { e.preventDefault(); mutation.mutate() }
  return <div className="section-stack"><header className="section-heading"><div><h2>Thông tin cơ bản</h2><p>Thông tin người vận hành nhìn thấy và chính sách phí/xác thực của dịch vụ.</p></div></header>
    <form className="panel form-stack" onSubmit={submit}>
      <label>Mã dịch vụ<input value={service.code} disabled/><small>Mã được cố định sau khi tạo để các hệ thống tích hợp không bị gián đoạn.</small></label>
      <label>Tên hiển thị<input required minLength={2} maxLength={100} disabled={readOnly} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
      <label>Mô tả<textarea rows={4} maxLength={1000} disabled={readOnly} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></label>
      <div className="form-grid"><label>Cách tính phí<select disabled={readOnly} value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value as 'fixed' | 'percent' })}><option value="fixed">Số tiền cố định</option><option value="percent">Phần trăm giao dịch</option></select></label><label>Giá trị<input disabled={readOnly} type="number" min="0" step="any" value={form.feeValue} onChange={(e) => setForm({ ...form, feeValue: e.target.value })}/></label><label>Phí tối thiểu<input disabled={readOnly} type="number" min="0" value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })}/></label><label>Phí tối đa<input disabled={readOnly} type="number" min="0" value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })}/></label></div>
      <label>Xác thực giao dịch<select disabled={readOnly} value={form.auth} onChange={(e) => setForm({ ...form, auth: e.target.value as 'NONE' | 'PIN' })}><option value="NONE">Không yêu cầu PIN</option><option value="PIN">Yêu cầu PIN</option></select></label>
      {mutation.error && <div className="alert error">{mutation.error instanceof Error ? mutation.error.message : 'Không lưu được thay đổi'}</div>}
      {!readOnly && <div className="form-actions"><button className="button primary" disabled={mutation.isPending}>{mutation.isPending ? 'Đang lưu…' : 'Lưu thông tin'}</button></div>}
    </form></div>
}
