import { FormEvent, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { serviceApi } from './api'

export function ServiceCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ serviceCode: '', name: '', description: '', feeType: 'fixed', feeValue: '0', auth: 'NONE' })
  const mutation = useMutation({ mutationFn: () => serviceApi.create({ serviceCode: form.serviceCode.trim().toUpperCase(), name: form.name.trim(), description: form.description.trim(), fee: { type: form.feeType, value: Number(form.feeValue) }, auth: { method: form.auth } }), onSuccess: ({ service }) => { queryClient.invalidateQueries({ queryKey: ['services'] }); navigate(`/services/${service.id}/config/field-builder`) } })
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate() }
  return <section className="page-stack narrow"><header className="page-heading"><div><p className="eyebrow">Bước khởi đầu</p><h1>Tạo dịch vụ mới</h1><p>Chỉ cần thông tin nhận diện và chính sách phí. Các cấu hình còn lại sẽ được hướng dẫn theo từng bước.</p></div></header>
    <form className="panel form-stack" onSubmit={submit}>
      <label>Mã dịch vụ<input required minLength={2} maxLength={100} pattern="[A-Za-z0-9][A-Za-z0-9_-]+" placeholder="Ví dụ: BILL_PAYMENT" value={form.serviceCode} onChange={(e) => setForm({ ...form, serviceCode: e.target.value.toUpperCase() })}/><small>Dùng chữ in hoa, số, gạch dưới hoặc gạch ngang. Mã không đổi được sau khi tạo.</small></label>
      <label>Tên hiển thị<input required minLength={2} maxLength={100} placeholder="Ví dụ: Thanh toán hóa đơn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
      <label>Mô tả<textarea maxLength={1000} rows={3} placeholder="Dịch vụ này giúp người dùng làm gì?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></label>
      <div className="form-grid"><label>Cách tính phí<select value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })}><option value="fixed">Số tiền cố định</option><option value="percent">Phần trăm giao dịch</option></select></label><label>Mức phí<input required type="number" min="0" step="any" value={form.feeValue} onChange={(e) => setForm({ ...form, feeValue: e.target.value })}/></label></div>
      <label>Xác thực<select value={form.auth} onChange={(e) => setForm({ ...form, auth: e.target.value })}><option value="NONE">Không yêu cầu PIN</option><option value="PIN">Yêu cầu PIN khi xác nhận</option></select></label>
      {mutation.error && <div className="alert error">{mutation.error instanceof Error ? mutation.error.message : 'Không tạo được dịch vụ'}</div>}
      <div className="form-actions"><button type="button" className="button secondary" onClick={() => navigate('/services')}>Hủy</button><button className="button primary" disabled={mutation.isPending}>{mutation.isPending ? 'Đang tạo…' : 'Tạo và dựng biến'}</button></div>
    </form>
  </section>
}
