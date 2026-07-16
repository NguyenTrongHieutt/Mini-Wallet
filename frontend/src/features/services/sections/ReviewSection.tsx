import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../lib/api'
import { builtInFields } from '../catalogs'
import { serviceApi } from '../api'
import { serviceKeys } from '../serviceQueries'
import type { Service, TransDefinition, TransField, TransValidation } from '../types'

export function ReviewSection({ service }: { service: Service; readOnly: boolean }) {
  const client = useQueryClient()
  const results = useQueries({ queries: [
    { queryKey: serviceKeys.fields(service.id), queryFn: () => serviceApi.listFields(service.id) },
    { queryKey: serviceKeys.validations(service.id), queryFn: () => serviceApi.listValidations(service.id) },
    { queryKey: serviceKeys.definition(service.id), queryFn: async () => { try { return await serviceApi.definition(service.id) } catch (error) { if (error instanceof ApiError && error.code === 404) return { transDefinition: null }; throw error } } },
  ] })
  const fields = (results[0].data?.items ?? []) as TransField[]
  const validations = (results[1].data?.items ?? []) as TransValidation[]
  const definition = (results[2].data?.transDefinition ?? null) as TransDefinition | null
  const available = new Set([...builtInFields, ...service.fieldBuilder.map((field) => field.name), 'DEBITFEE', 'TOTALAMOUNT'])
  const activeFields = fields.filter((field) => field.status === 'active')
  const unknownFields = activeFields.filter((field) => !available.has(field.fieldName))
  const unknownLedger = definition?.glSteps.flatMap((step) => [step.amount, ...(step.debit.level === 'productLevel' ? [step.debit.target] : []), ...(step.credit.level === 'productLevel' ? [step.credit.target] : [])]).filter((field) => !available.has(field)) ?? []
  const checks = [
    { ok: service.name.length >= 2, label: 'Thông tin cơ bản đầy đủ' },
    { ok: service.fieldBuilder.length > 0, label: 'Có ít nhất một biến giao dịch' },
    { ok: activeFields.length > 0, label: 'Có ít nhất một trường nhập đang dùng' },
    { ok: unknownFields.length === 0, label: unknownFields.length ? `Trường chưa được dựng: ${unknownFields.map((field) => field.fieldName).join(', ')}` : 'Mọi trường nhập đều được dựng' },
    { ok: Boolean(definition?.status === 'active' && definition.glSteps.length), label: 'Có định khoản đang hoạt động' },
    { ok: unknownLedger.length === 0, label: unknownLedger.length ? `Định khoản dùng biến chưa tồn tại: ${[...new Set(unknownLedger)].join(', ')}` : 'Các biến định khoản hợp lệ' },
  ]
  const ready = checks.every((check) => check.ok) && !results.some((result) => result.isLoading)
  const publish = useMutation({ mutationFn: () => serviceApi.publish(service.id), onSuccess: ({ service: next }) => client.setQueryData(serviceKeys.detail(service.id), { service: next }) })
  const unpublish = useMutation({ mutationFn: () => serviceApi.unpublish(service.id), onSuccess: ({ service: next }) => client.setQueryData(serviceKeys.detail(service.id), { service: next }) })
  return <div className="section-stack"><header className="section-heading"><div><h2>Kiểm tra và xuất bản</h2><p>Xem lại mức độ sẵn sàng trước khi cho phép giao dịch mới sử dụng dịch vụ.</p></div></header>
    <div className="review-grid"><article className="panel"><h3>Danh sách kiểm tra</h3><ul className="checklist">{checks.map((check) => <li className={check.ok ? 'ok' : 'missing'} key={check.label}><span>{check.ok ? '✓' : '!'}</span>{check.label}</li>)}</ul></article><article className="panel summary-card"><h3>Tổng quan cấu hình</h3><dl><div><dt>Biến runtime</dt><dd>{service.fieldBuilder.length}</dd></div><div><dt>Trường nhập active</dt><dd>{activeFields.length}</dd></div><div><dt>Validation active</dt><dd>{validations.filter((item) => item.status === 'active').length}</dd></div><div><dt>Bước định khoản</dt><dd>{definition?.glSteps.length ?? 0}</dd></div><div><dt>Actions bật</dt><dd>{['request', 'confirm', 'verify'].filter((key) => service.actions[key] && (service.actions[key] as { enabled?: boolean }).enabled).length}</dd></div></dl></article></div>
    <div className={`publish-panel ${service.status === 'active' ? 'published' : ready ? 'ready' : 'blocked'}`}><div><h3>{service.status === 'active' ? 'Dịch vụ đang hoạt động' : ready ? 'Sẵn sàng xuất bản' : 'Còn cấu hình cần hoàn thiện'}</h3><p>{service.status === 'active' ? 'Giao dịch mới có thể sử dụng dịch vụ này.' : ready ? 'Backend sẽ kiểm tra lại toàn bộ cấu hình khi xuất bản.' : 'Hoàn thành các mục còn dấu chấm than trước khi tiếp tục.'}</p></div>{service.status === 'active' ? <button className="button warning" disabled={unpublish.isPending} onClick={() => { if (window.confirm('Tắt dịch vụ? Giao dịch mới sẽ không thể khởi tạo.')) unpublish.mutate() }}>Tắt dịch vụ</button> : <button className="button primary" disabled={!ready || publish.isPending} onClick={() => { if (window.confirm('Xuất bản dịch vụ và cho phép giao dịch mới sử dụng?')) publish.mutate() }}>{publish.isPending ? 'Đang xuất bản…' : 'Xuất bản dịch vụ'}</button>}</div>
    {(publish.error || unpublish.error) && <div className="alert error">{(publish.error ?? unpublish.error) instanceof Error ? (publish.error ?? unpublish.error as Error)?.message : 'Không thay đổi được trạng thái dịch vụ'}</div>}
  </div>
}
