import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiPost, ApiError } from '../../../lib/api'
import { serviceApi } from '../api'
import { builtInFields } from '../catalogs'
import { moveOrderedItem, normalizeOrder, removeOrderedItem } from '../orderUtils'
import type { GlStep, Service } from '../types'
import { SuggestionCombobox } from './SuggestionCombobox'

const blankStep = (order: number): GlStep => ({
  order,
  amount: 'AMOUNT',
  debit: { level: 'productLevel', target: 'SENDERID' },
  credit: { level: 'productLevel', target: 'RECEIVERID' },
})

export function LedgerSection({ service, readOnly }: { service: Service; readOnly: boolean }) {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['serviceDefinition', service.id],
    queryFn: async () => {
      try {
        return await serviceApi.definition(service.id)
      } catch (error) {
        if (error instanceof ApiError && error.code === 404) return { transDefinition: null }
        throw error
      }
    },
  })
  const pockets = useQuery({
    queryKey: ['pockets', { pageSize: 100 }],
    queryFn: () => apiPost<{ items: Array<{ id: string; name: string; ownerType: string }> }>('/api/v1/officer/pockets/list', { page: 1, pageSize: 100, status: 'active' }),
  })
  const [steps, setSteps] = useState<GlStep[]>([])
  const [advanced, setAdvanced] = useState(false)
  const [json, setJson] = useState('[]')
  const [jsonError, setJsonError] = useState('')

  useEffect(() => {
    const next = query.data?.transDefinition?.glSteps ?? []
    setSteps(next)
    setJson(JSON.stringify(next, null, 2))
  }, [query.data])

  const mutation = useMutation({
    mutationFn: (value: GlStep[]) => serviceApi.updateDefinition(service.id, value),
    onSuccess: ({ transDefinition }) => {
      const next = normalizeOrder(transDefinition.glSteps)
      client.setQueryData(['serviceDefinition', service.id], { transDefinition: { ...transDefinition, glSteps: next } })
      setSteps(next)
      setJson(JSON.stringify(next, null, 2))
    },
  })
  const fields = [...builtInFields, ...service.fieldBuilder.map((field) => field.name), 'DEBITFEE', 'TOTALAMOUNT']

  const syncSteps = (next: GlStep[]) => {
    const normalized = normalizeOrder(next)
    setSteps(normalized)
    setJson(JSON.stringify(normalized, null, 2))
    return normalized
  }

  const persistSteps = (next: GlStep[]) => {
    const normalized = syncSteps(next)
    setJsonError('')
    mutation.mutate(normalized)
  }

  const update = (index: number, patch: Partial<GlStep>) => {
    syncSteps(steps.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step))
  }
  const updateTarget = (index: number, side: 'debit' | 'credit', patch: Partial<GlStep['debit']>) => {
    syncSteps(steps.map((step, stepIndex) => stepIndex === index ? { ...step, [side]: { ...step[side], ...patch } } : step))
  }

  const saveJson = () => {
    try {
      const parsed: unknown = JSON.parse(json)
      if (!Array.isArray(parsed)) throw new Error('Định khoản phải là một danh sách')
      persistSteps(parsed as GlStep[])
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'JSON không hợp lệ')
    }
  }

  const toggleAdvanced = () => {
    if (!advanced) {
      setJson(JSON.stringify(steps, null, 2))
    } else {
      try {
        const parsed: unknown = JSON.parse(json)
        if (!Array.isArray(parsed)) throw new Error('Định khoản phải là một danh sách')
        syncSteps(parsed as GlStep[])
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : 'JSON không hợp lệ')
        return
      }
    }
    setJsonError('')
    setAdvanced((value) => !value)
  }

  return <div className="section-stack">
    <header className="section-heading">
      <div>
        <h2>Định khoản</h2>
        <p>Mỗi bước chuyển một khoản tiền từ ví ghi nợ sang ví ghi có.</p>
      </div>
      <button className="button ghost" type="button" onClick={toggleAdvanced}>{advanced ? 'Dùng trình dựng trực quan' : 'Cấu hình nâng cao'}</button>
    </header>

    {advanced ? <div className="panel form-stack">
      <label>JSON glSteps
        <textarea className="code-editor" rows={22} disabled={readOnly} value={json} onChange={(event) => setJson(event.target.value)}/>
      </label>
      {jsonError && <div className="alert error">{jsonError}</div>}
      {!readOnly && <div className="form-actions">
        <button className="button primary" type="button" disabled={mutation.isPending} onClick={saveJson}>Lưu định khoản</button>
      </div>}
    </div> : <>
      {!steps.length && <div className="panel empty-state">Chưa có bước định khoản. Chọn “Thêm bước” để bắt đầu.</div>}
      <div className="builder-list">
        {steps.map((step, index) => <article className="panel builder-card" key={index}>
          <div className="builder-card-title">
            <strong>Bước {index + 1}</strong>
            {!readOnly && <div className="order-actions">
              <button className="order-button" type="button" disabled={mutation.isPending || index === 0} onClick={() => persistSteps(moveOrderedItem(steps, index, index - 1))}>↑ Lên</button>
              <button className="order-button" type="button" disabled={mutation.isPending || index === steps.length - 1} onClick={() => persistSteps(moveOrderedItem(steps, index, index + 1))}>↓ Xuống</button>
              <button className="order-button danger" type="button" disabled={mutation.isPending} onClick={() => persistSteps(removeOrderedItem(steps, index))}>Xóa</button>
            </div>}
          </div>

          <label>Biến chứa số tiền
            <select disabled={readOnly} value={step.amount} onChange={(event) => update(index, { amount: event.target.value })}>
              {fields.map((field) => <option key={field}>{field}</option>)}
            </select>
          </label>

          {(['debit', 'credit'] as const).map((side) => <fieldset key={side}>
            <legend>{side === 'debit' ? 'Ví bị trừ tiền' : 'Ví được cộng tiền'}</legend>
            <div className="form-grid">
              <label>Cách xác định ví
                <select disabled={readOnly} value={step[side].level} onChange={(event) => updateTarget(index, side, { level: event.target.value as 'productLevel' | 'wallet', target: '' })}>
                  <option value="productLevel">Lấy từ biến giao dịch</option>
                  <option value="wallet">Chọn ví cố định</option>
                </select>
              </label>
              {step[side].level === 'productLevel'
                ? <label>Biến chứa mã ví
                  <select disabled={readOnly} value={step[side].target} onChange={(event) => updateTarget(index, side, { target: event.target.value })}>
                    <option value="">Chọn field đã dựng</option>
                    {fields.map((field) => <option key={field}>{field}</option>)}
                  </select>
                  <small>Chọn một field runtime hiện có, không nhập tự do.</small>
                </label>
                : <label>Ví cố định
                  <SuggestionCombobox
                    disabled={readOnly}
                    value={step[side].target}
                    placeholder="Nhập ID ví hoặc tìm theo tên, loại ví"
                    emptyText="Không tìm thấy ví phù hợp. Bạn vẫn có thể dán trực tiếp ID ví."
                    options={(pockets.data?.items ?? []).map((pocket) => ({ value: pocket.id, label: pocket.name, description: `Loại ví: ${pocket.ownerType}`, keywords: pocket.ownerType }))}
                    onChange={(target) => updateTarget(index, side, { target })}
                  />
                  <small>Có thể tự nhập ID ví hoặc chọn từ cửa sổ gợi ý cuộn.</small>
                </label>}
            </div>
          </fieldset>)}
        </article>)}
      </div>

      {!readOnly && <div className="sticky-actions">
        <button className="button secondary" type="button" disabled={mutation.isPending} onClick={() => syncSteps([...steps, blankStep(steps.length + 1)])}>+ Thêm bước</button>
        <button className="button primary" type="button" disabled={mutation.isPending} onClick={() => persistSteps(steps)}>{mutation.isPending ? 'Đang cập nhật API…' : 'Lưu định khoản'}</button>
      </div>}
    </>}

    {pockets.error && <div className="alert error">{pockets.error instanceof Error ? pockets.error.message : 'Không tải được danh sách ví cố định.'}</div>}
    {mutation.error && <div className="alert error">{mutation.error instanceof Error ? mutation.error.message : 'Định khoản chưa hợp lệ'}</div>}
  </div>
}
