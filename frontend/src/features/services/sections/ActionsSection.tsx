import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { providerApi } from '../../providers/api/providerApi'
import { providerKeys } from '../../providers/api/providerQueries'
import type { ProviderFilters } from '../../providers/types'
import { serviceApi } from '../api'
import type { ActionPhase, Service, ServiceActions } from '../types'
import { JsonValueEditor } from './JsonValueEditor'
import { SuggestionCombobox } from './SuggestionCombobox'

const emptyPhase = (urlField: string): ActionPhase => ({ enabled: false, urlField, method: 'POST', timeoutMs: 10000, requestMap: {}, responseMap: {} })

type SuccessOperator = 'none' | 'equals' | 'notEquals' | 'in'

function successOperator(rule?: ActionPhase['successRule']): SuccessOperator {
  if (!rule) return 'none'
  if (rule.in !== undefined) return 'in'
  if (rule.notEquals !== undefined) return 'notEquals'
  return 'equals'
}

function friendlyValue(value: unknown): string {
  if (value === undefined || value === null) return value === null ? 'null' : ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function parseFriendlyValue(value: string): unknown {
  const normalized = value.trim()
  if (!normalized) return ''
  try { return JSON.parse(normalized) } catch { return normalized }
}

function successValue(rule?: ActionPhase['successRule']): string {
  const operator = successOperator(rule)
  if (!rule || operator === 'none') return ''
  if (operator === 'in') return (rule.in ?? []).map(friendlyValue).join(', ')
  return friendlyValue(rule[operator])
}

function buildSuccessRule(
  current: ActionPhase['successRule'] | undefined,
  field: string,
  operator: SuccessOperator,
  rawValue: string,
): ActionPhase['successRule'] | undefined {
  if (operator === 'none') return undefined
  const next: Record<string, unknown> = { ...(current ?? {}), field }
  delete next.equals
  delete next.notEquals
  delete next.in
  if (operator === 'in') {
    next.in = rawValue.split(',').map((item) => item.trim()).filter(Boolean).map(parseFriendlyValue)
  } else {
    next[operator] = parseFriendlyValue(rawValue)
  }
  return next as ActionPhase['successRule']
}

export function ActionsSection({ service, readOnly }: { service: Service; readOnly: boolean }) {
  const client = useQueryClient()
  const initial: ServiceActions = { provider: { codeSource: 'TRANSBODY', codeField: 'PROVIDERCODE' }, request: emptyPhase('requestUrl'), confirm: emptyPhase('confirmUrl'), verify: emptyPhase('verifyUrl'), ...service.actions }
  const [actions, setActions] = useState<ServiceActions>(initial)
  const [advanced, setAdvanced] = useState(false)
  const [json, setJson] = useState(JSON.stringify(initial, null, 2))
  const [jsonError, setJsonError] = useState('')
  useEffect(() => { const next = { provider: { codeSource: 'TRANSBODY' as const, codeField: 'PROVIDERCODE' }, request: emptyPhase('requestUrl'), confirm: emptyPhase('confirmUrl'), verify: emptyPhase('verifyUrl'), ...service.actions }; setActions(next); setJson(JSON.stringify(next, null, 2)) }, [service])
  const providerFilters: ProviderFilters = { serviceCode: service.code, status: 'active', page: 1, pageSize: 100 }
  const providers = useQuery({ queryKey: providerKeys.list(providerFilters), queryFn: () => providerApi.list(providerFilters) })
  const mutation = useMutation({ mutationFn: (value: ServiceActions) => {
    const resolver = value.provider
    if (resolver?.codeSource === 'FIXED' && !providers.data?.items.some((item) => item.code === resolver.codeValue)) {
      throw new Error('Hãy chọn một Provider active thuộc đúng dịch vụ này.')
    }
    if (resolver?.codeSource !== 'FIXED' && !resolver?.codeField) throw new Error('Hãy chọn biến chứa mã Provider.')
    for (const phaseName of ['request', 'confirm', 'verify'] as const) {
      const rule = value[phaseName]?.successRule
      if (rule && !rule.field.trim()) throw new Error(`Hãy nhập đường dẫn phản hồi cho successRule của ${phaseName}.`)
    }
    return serviceApi.updateActions(service.id, value)
  }, onSuccess: ({ service: next }) => { client.setQueryData(['service', service.id], { service: next }); setActions(next.actions); setJson(JSON.stringify(next.actions, null, 2)) } })
  const updatePhase = (name: 'request' | 'confirm' | 'verify', patch: Partial<ActionPhase>) => setActions((current) => ({ ...current, [name]: { ...(current[name] ?? emptyPhase(`${name}Url`)), ...patch } }))
  const saveJson = () => { try { const parsed: unknown = JSON.parse(json); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Actions phải là một đối tượng'); setJsonError(''); mutation.mutate(parsed as ServiceActions) } catch (error) { setJsonError(error instanceof Error ? error.message : 'JSON không hợp lệ') } }
  const toggleAdvanced = () => {
    if (!advanced) {
      setJson(JSON.stringify(actions, null, 2))
    } else {
      try {
        const parsed: unknown = JSON.parse(json)
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Actions phải là một đối tượng')
        setActions(parsed as ServiceActions)
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : 'JSON không hợp lệ')
        return
      }
    }
    setJsonError('')
    setAdvanced((value) => !value)
  }
  const provider = actions.provider ?? { codeSource: 'TRANSBODY', codeField: 'PROVIDERCODE' }
  return <div className="section-stack"><header className="section-heading"><div><h2>Kết nối Provider và Actions</h2><p>Chỉ cấu hình cách dịch vụ gọi Provider. Việc tạo hoặc sửa Provider nằm ở khu vực quản lý riêng.</p></div><div className="header-actions"><Link className="button secondary" to={`/providers?serviceCode=${service.code}`}>Quản lý Provider</Link><button className="button ghost" type="button" onClick={toggleAdvanced}>{advanced ? 'Dùng form trực quan' : 'Cấu hình nâng cao'}</button></div></header>
    {advanced ? <div className="panel form-stack"><label>JSON Actions<textarea className="code-editor" rows={24} disabled={readOnly} value={json} onChange={(e) => setJson(e.target.value)}/></label>{jsonError && <div className="alert error">{jsonError}</div>}{!readOnly && <div className="form-actions"><button className="button secondary" type="button" onClick={() => { try { setJson(JSON.stringify(JSON.parse(json), null, 2)); setJsonError('') } catch { setJsonError('JSON chưa hợp lệ') } }}>Định dạng</button><button className="button primary" onClick={saveJson}>Lưu toàn bộ Actions</button></div>}</div> : <>
      <div className="panel form-stack"><h3>Dịch vụ sẽ chọn Provider thế nào?</h3><div className="segmented"><button type="button" disabled={readOnly} className={provider.codeSource === 'FIXED' ? 'active' : ''} onClick={() => setActions({ ...actions, provider: { ...provider, codeSource: 'FIXED', codeValue: provider.codeValue ?? '' } })}>Một Provider cố định</button><button type="button" disabled={readOnly} className={provider.codeSource !== 'FIXED' ? 'active' : ''} onClick={() => setActions({ ...actions, provider: { ...provider, codeSource: 'TRANSBODY', codeField: provider.codeField ?? service.fieldBuilder[0]?.name ?? '' } })}>Lấy từ trường đã dựng</button></div>{provider.codeSource === 'FIXED' ? <label>Provider active thuộc {service.code}<SuggestionCombobox disabled={readOnly} value={provider.codeValue ?? ''} normalizeInput={(value) => value.toUpperCase()} placeholder="Nhập mã, tên hoặc nhóm Provider để tìm" options={(providers.data?.items ?? []).map((entry) => ({ value: entry.code, label: entry.name, description: `${entry.type}${entry.category ? ` · ${entry.category}` : ''}`, keywords: `${entry.serviceCode} ${entry.category ?? ''}` }))} onChange={(codeValue) => setActions({ ...actions, provider: { ...provider, codeSource: 'FIXED', codeValue } })}/><small>Chọn trong cửa sổ gợi ý hoặc tự nhập chính xác mã Provider.</small>{providers.error && <small className="field-error">Không tải được Provider. Hãy thử lại trước khi lưu.</small>}{!providers.isLoading && !providers.data?.items.length && <small>Chưa có Provider phù hợp. Hãy tạo ở khu vực Quản lý Provider.</small>}</label> : <label>Trường chứa mã Provider<select disabled={readOnly} value={provider.codeField ?? ''} onChange={(e) => setActions({ ...actions, provider: { ...provider, codeSource: 'TRANSBODY', codeField: e.target.value } })}><option value="">Chọn field đã dựng</option>{service.fieldBuilder.map((field) => <option key={field.name} value={field.name}>{field.role} ({field.name})</option>)}</select><small>Chỉ có thể chọn các field đang tồn tại trong Field Builder.</small></label>}</div>
      {(['request', 'confirm', 'verify'] as const).map((name) => {
        const phase = actions[name] ?? emptyPhase(`${name}Url`)
        const label = name === 'request' ? 'Request — lấy dữ liệu ban đầu' : name === 'confirm' ? 'Confirm — xác nhận với Provider' : 'Verify — thực thi tại Provider'
        const isObject = (value: unknown): value is Record<string, string> => Boolean(value && !Array.isArray(value) && typeof value === 'object')
        const operator = successOperator(phase.successRule)
        const ruleValue = successValue(phase.successRule)
        const updateRule = (field: string, nextOperator: SuccessOperator, value: string) => updatePhase(name, { successRule: buildSuccessRule(phase.successRule, field, nextOperator, value) })
        return <article className="panel phase-card" key={name}>
          <div className="phase-title"><div><h3>{label}</h3><p>Bật khi dịch vụ cần gọi hệ thống ngoài ở giai đoạn này.</p></div><label className="switch"><input type="checkbox" disabled={readOnly} checked={phase.enabled} onChange={(e) => updatePhase(name, { enabled: e.target.checked })}/><span>{phase.enabled ? 'Đang bật' : 'Đang tắt'}</span></label></div>
          {phase.enabled && <div className="form-stack">
            <div className="form-grid"><label>Trường URL trên Provider<input disabled={readOnly} value={phase.urlField ?? `${name}Url`} onChange={(e) => updatePhase(name, { urlField: e.target.value })}/></label><label>HTTP method<select disabled={readOnly} value={phase.method ?? 'POST'} onChange={(e) => updatePhase(name, { method: e.target.value })}><option>POST</option><option>PUT</option><option>PATCH</option></select></label><label>Timeout (ms)<input disabled={readOnly} type="number" min="100" step="1" value={phase.timeoutMs ?? 10000} onChange={(e) => updatePhase(name, { timeoutMs: Number(e.target.value) })}/></label></div>
            <JsonValueEditor label="Ánh xạ dữ liệu gửi đi (JSON)" disabled={readOnly} value={phase.requestMap ?? {}} onChange={(requestMap) => updatePhase(name, { requestMap })} validate={isObject}/>
            <JsonValueEditor label="Ánh xạ kết quả về biến giao dịch (JSON)" disabled={readOnly} value={phase.responseMap ?? {}} onChange={(responseMap) => updatePhase(name, { responseMap })} validate={isObject}/>
            <fieldset className="success-rule-builder"><legend>Điều kiện Provider trả thành công</legend><p>Chọn cách kiểm tra phản hồi. Nếu không cấu hình, hệ thống dùng quy tắc mặc định của envelope.</p><div className="form-grid"><label>Cách kiểm tra<select disabled={readOnly} value={operator} onChange={(e) => updateRule(phase.successRule?.field ?? 'err', e.target.value as SuccessOperator, ruleValue)}><option value="none">Dùng quy tắc mặc định</option><option value="equals">Giá trị bằng</option><option value="notEquals">Giá trị khác</option><option value="in">Giá trị thuộc danh sách</option></select></label>{operator !== 'none' && <><label>Đường dẫn trong phản hồi<input disabled={readOnly} list={`response-path-suggestions-${name}`} placeholder="Ví dụ: data.status hoặc err" value={phase.successRule?.field ?? ''} onChange={(e) => updateRule(e.target.value, operator, ruleValue)}/><datalist id={`response-path-suggestions-${name}`}><option value="err"/><option value="status"/><option value="data.status"/><option value="data.code"/></datalist></label><label>{operator === 'in' ? 'Các giá trị chấp nhận' : 'Giá trị so sánh'}<input disabled={readOnly} placeholder={operator === 'in' ? 'SUCCESS, PAID, 200' : 'SUCCESS'} value={ruleValue} onChange={(e) => updateRule(phase.successRule?.field ?? 'err', operator, e.target.value)}/><small>{operator === 'in' ? 'Phân tách nhiều giá trị bằng dấu phẩy.' : 'Số, boolean và null sẽ được nhận dạng tự động.'}</small></label></>}</div></fieldset>
          </div>}
        </article>
      })}
      {!readOnly && <div className="sticky-actions"><button className="button primary" disabled={mutation.isPending} onClick={() => mutation.mutate(actions)}>{mutation.isPending ? 'Đang lưu…' : 'Lưu cấu hình Actions'}</button></div>}
    </>}
    {mutation.error && <div className="alert error">{mutation.error instanceof Error ? mutation.error.message : 'Không lưu được Actions'}</div>}
  </div>
}
