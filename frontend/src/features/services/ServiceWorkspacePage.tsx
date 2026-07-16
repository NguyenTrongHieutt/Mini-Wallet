import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'
import { serviceApi } from './api'
import { serviceSteps } from './catalogs'
import { BasicSection } from './sections/BasicSection'
import { FieldBuilderSection } from './sections/FieldBuilderSection'
import { TransFieldsSection } from './sections/TransFieldsSection'
import { ValidationsSection } from './sections/ValidationsSection'
import { ActionsSection } from './sections/ActionsSection'
import { LedgerSection } from './sections/LedgerSection'
import { ReviewSection } from './sections/ReviewSection'

const validSteps = new Set(serviceSteps.map(([key]) => key))

export function ServiceWorkspacePage() {
  const { serviceId = '', step = 'basic' } = useParams()
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['service', serviceId], queryFn: () => serviceApi.detail(serviceId), enabled: Boolean(serviceId) })
  const unpublish = useMutation({ mutationFn: () => serviceApi.unpublish(serviceId), onSuccess: () => client.invalidateQueries({ queryKey: ['service', serviceId] }) })
  if (!validSteps.has(step as never)) return <Navigate replace to={`/services/${serviceId}/config/basic`} />
  if (query.isLoading) return <div className="panel empty-state">Đang tải cấu hình dịch vụ…</div>
  if (query.error || !query.data) return <div className="alert error">{query.error instanceof Error ? query.error.message : 'Không tìm thấy dịch vụ'}</div>
  const service = query.data.service
  const readOnly = service.status === 'active'
  return <section className="workspace">
    <header className="workspace-header">
      <div><Link className="back-link" to="/services">← Danh sách dịch vụ</Link><div className="workspace-title"><div><p className="eyebrow">{service.code}</p><h1>{service.name}</h1></div><span className={`badge ${service.status}`}>{service.status === 'active' ? 'Đang hoạt động' : service.status === 'draft' ? 'Bản nháp' : 'Đã tắt'}</span></div></div>
      {readOnly && <button className="button warning" disabled={unpublish.isPending} onClick={() => { if (window.confirm('Tắt dịch vụ để mở khóa chỉnh sửa? Giao dịch mới sẽ tạm ngừng.')) unpublish.mutate() }}>{unpublish.isPending ? 'Đang tắt…' : 'Tắt để chỉnh sửa'}</button>}
    </header>
    {readOnly && <div className="alert info"><strong>Đang ở chế độ chỉ đọc.</strong> Dịch vụ đang phục vụ giao dịch. Hãy tắt dịch vụ trước khi thay đổi cấu hình.</div>}
    {unpublish.error && <div className="alert error">{unpublish.error instanceof Error ? unpublish.error.message : 'Không thể tắt dịch vụ.'}</div>}
    <nav className="stepper" aria-label="Các bước cấu hình">{serviceSteps.map(([key, label], index) => <Link key={key} className={step === key ? 'active' : ''} to={`/services/${serviceId}/config/${key}`}><span>{index + 1}</span>{label}</Link>)}</nav>
    <div className="workspace-content">
      {step === 'basic' && <BasicSection service={service} readOnly={readOnly} />}
      {step === 'field-builder' && <FieldBuilderSection service={service} readOnly={readOnly} />}
      {step === 'trans-fields' && <TransFieldsSection service={service} readOnly={readOnly} />}
      {step === 'validations' && <ValidationsSection service={service} readOnly={readOnly} />}
      {step === 'actions' && <ActionsSection service={service} readOnly={readOnly} />}
      {step === 'ledger' && <LedgerSection service={service} readOnly={readOnly} />}
      {step === 'review' && <ReviewSection service={service} readOnly={readOnly} />}
    </div>
  </section>
}
