import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceApi } from '../api'
import { builderQueries } from '../catalogs'
import { moveOrderedItem, normalizeOrder, removeOrderedItem } from '../orderUtils'
import type { FieldBuilderItem, Service } from '../types'
import { JsonValueEditor } from './JsonValueEditor'

const blank = (order: number): FieldBuilderItem => ({
  order,
  name: '',
  role: '',
  rule: 'mapping',
  source: 'body',
  variable: '',
  datatype: 'string',
  errorCode: 'FIELD_REQUIRED',
})

const bodyFieldSuggestions = ['amount', 'currency', 'providerCode', 'receiverPhone', 'message', 'billCode']
const userFieldSuggestions = ['id', 'phone', 'displayName', 'status', 'role']

export function FieldBuilderSection({ service, readOnly }: { service: Service; readOnly: boolean }) {
  const client = useQueryClient()
  const [items, setItems] = useState<FieldBuilderItem[]>(service.fieldBuilder)
  const [advanced, setAdvanced] = useState(false)
  const [json, setJson] = useState(JSON.stringify(service.fieldBuilder, null, 2))
  const [jsonError, setJsonError] = useState('')

  useEffect(() => {
    setItems(service.fieldBuilder)
    setJson(JSON.stringify(service.fieldBuilder, null, 2))
  }, [service])

  const mutation = useMutation({
    mutationFn: (value: FieldBuilderItem[]) => serviceApi.updateFieldBuilder(service.id, value),
    onSuccess: ({ service: next }) => {
      client.setQueryData(['service', service.id], { service: next })
      setItems(next.fieldBuilder)
      setJson(JSON.stringify(next.fieldBuilder, null, 2))
    },
  })

  const syncItems = (next: FieldBuilderItem[]) => {
    const normalized = normalizeOrder(next)
    setItems(normalized)
    setJson(JSON.stringify(normalized, null, 2))
    return normalized
  }

  const prepareItems = (value: FieldBuilderItem[]) => normalizeOrder(value).map((item) => {
    if (item.rule !== 'fixed') return item
    const raw = item.value
    const fixedValue = item.datatype === 'number'
      ? Number(raw)
      : item.datatype === 'boolean'
        ? raw === true || raw === 'true'
        : raw
    return { ...item, value: fixedValue }
  })

  const persistItems = (next: FieldBuilderItem[]) => {
    const prepared = prepareItems(next)
    syncItems(prepared)
    setJsonError('')
    mutation.mutate(prepared)
  }

  const update = (index: number, patch: Partial<FieldBuilderItem>) => {
    syncItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  const saveJson = () => {
    try {
      const parsed: unknown = JSON.parse(json)
      if (!Array.isArray(parsed)) throw new Error('Cấu hình phải là một danh sách')
      persistItems(parsed as FieldBuilderItem[])
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'JSON không hợp lệ')
    }
  }

  const toggleAdvanced = () => {
    if (!advanced) {
      setJson(JSON.stringify(items, null, 2))
    } else {
      try {
        const parsed: unknown = JSON.parse(json)
        if (!Array.isArray(parsed)) throw new Error('Cấu hình phải là một danh sách')
        syncItems(parsed as FieldBuilderItem[])
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
        <h2>Dựng biến giao dịch</h2>
        <p>Biến được tạo lần lượt từ dữ liệu nhập, thông tin người dùng, giá trị cố định hoặc truy vấn an toàn.</p>
      </div>
      <button className="button ghost" type="button" onClick={toggleAdvanced}>
        {advanced ? 'Dùng trình dựng trực quan' : 'Cấu hình nâng cao (JSON)'}
      </button>
    </header>

    {advanced ? <div className="panel form-stack">
      <label>JSON fieldBuilder
        <textarea className="code-editor" rows={20} disabled={readOnly} value={json} onChange={(event) => setJson(event.target.value)}/>
      </label>
      {jsonError && <div className="alert error">{jsonError}</div>}
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={() => {
          try {
            setJson(JSON.stringify(JSON.parse(json), null, 2))
            setJsonError('')
          } catch {
            setJsonError('Không thể định dạng JSON chưa hợp lệ')
          }
        }}>Định dạng</button>
        {!readOnly && <button className="button primary" type="button" disabled={mutation.isPending} onClick={saveJson}>Lưu JSON</button>}
      </div>
    </div> : <>
      {!items.length && <div className="panel empty-state">Chưa có biến nào. Chọn “Thêm biến” để bắt đầu dựng dữ liệu giao dịch.</div>}
      <div className="builder-list">
        {items.map((item, index) => <article className="panel builder-card" key={index}>
          <div className="builder-card-title">
            <strong>Biến {index + 1}</strong>
            {!readOnly && <div className="order-actions">
              <button className="order-button" type="button" disabled={mutation.isPending || index === 0} onClick={() => persistItems(moveOrderedItem(items, index, index - 1))}>↑ Lên</button>
              <button className="order-button" type="button" disabled={mutation.isPending || index === items.length - 1} onClick={() => persistItems(moveOrderedItem(items, index, index + 1))}>↓ Xuống</button>
              <button className="order-button danger" type="button" disabled={mutation.isPending} onClick={() => persistItems(removeOrderedItem(items, index))}>Xóa</button>
            </div>}
          </div>

          <div className="form-grid">
            <label>Tên biến
              <input disabled={readOnly} placeholder="AMOUNT" value={item.name} onChange={(event) => update(index, { name: event.target.value.toUpperCase() })}/>
            </label>
            <label>Ý nghĩa gần gũi
              <input disabled={readOnly} placeholder="Số tiền giao dịch" value={item.role} onChange={(event) => update(index, { role: event.target.value })}/>
            </label>
            <label>Cách tạo
              <select disabled={readOnly} value={item.rule} onChange={(event) => {
                const rule = event.target.value as FieldBuilderItem['rule']
                update(index, { rule, source: rule === 'fixed' ? 'constant' : rule === 'query' ? 'database' : 'body' })
              }}>
                <option value="mapping">Lấy từ dữ liệu có sẵn</option>
                <option value="fixed">Giá trị cố định</option>
                <option value="query">Tra cứu dữ liệu</option>
              </select>
            </label>
            <label>Kiểu dữ liệu
              <select disabled={readOnly} value={item.datatype} onChange={(event) => update(index, { datatype: event.target.value as FieldBuilderItem['datatype'] })}>
                <option value="string">Văn bản</option>
                <option value="number">Số</option>
                <option value="boolean">Đúng/Sai</option>
                <option value="object">Đối tượng</option>
              </select>
            </label>
          </div>

          {item.rule === 'mapping' && <div className="form-grid">
            <label>Nguồn
              <select disabled={readOnly} value={item.source} onChange={(event) => update(index, { source: event.target.value as 'body' | 'user', variable: '' })}>
                <option value="body">Dữ liệu người dùng nhập</option>
                <option value="user">Thông tin người đang thao tác</option>
              </select>
            </label>
            <label>Tên trường nguồn
              <input disabled={readOnly} list={`source-field-suggestions-${index}`} placeholder={item.source === 'user' ? 'Nhập hoặc chọn: id, phone…' : 'Nhập hoặc chọn: amount, currency…'} value={item.variable ?? ''} onChange={(event) => update(index, { variable: event.target.value })}/>
              <datalist id={`source-field-suggestions-${index}`}>
                {(item.source === 'user' ? userFieldSuggestions : bodyFieldSuggestions).map((suggestion) => <option key={suggestion} value={suggestion}/>)}
              </datalist>
              <small>Có thể tự nhập tên trường hoặc chọn một gợi ý phù hợp.</small>
            </label>
          </div>}

          {item.rule === 'fixed' && <label>Giá trị cố định
            <input disabled={readOnly} value={String(item.value ?? '')} onChange={(event) => update(index, { value: event.target.value })}/>
          </label>}

          {item.rule === 'query' && <>
            <label>Loại tra cứu
              <select disabled={readOnly} value={item.query ?? ''} onChange={(event) => update(index, { query: event.target.value })}>
                <option value="">Chọn cách tra cứu</option>
                {builderQueries.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
              </select>
            </label>
            <JsonValueEditor label="Tham số (JSON)" disabled={readOnly} rows={4} value={item.params ?? []} onChange={(params) => update(index, { params })} validate={(value): value is NonNullable<FieldBuilderItem['params']> => Array.isArray(value)} validationMessage="Tham số phải là một danh sách JSON."/>
            <label>Trường kết quả
              <input disabled={readOnly} placeholder="id" value={item.output ?? ''} onChange={(event) => update(index, { output: event.target.value })}/>
            </label>
          </>}

          <label>Mã lỗi dễ tra cứu
            <input disabled={readOnly} value={item.errorCode} onChange={(event) => update(index, { errorCode: event.target.value.toUpperCase() })}/>
          </label>
        </article>)}
      </div>

      {!readOnly && <div className="sticky-actions">
        <button className="button secondary" type="button" disabled={mutation.isPending} onClick={() => syncItems([...items, blank(items.length + 1)])}>+ Thêm biến</button>
        <button className="button primary" type="button" disabled={mutation.isPending} onClick={() => persistItems(items)}>{mutation.isPending ? 'Đang cập nhật API…' : 'Lưu danh sách biến'}</button>
      </div>}
    </>}

    {mutation.error && <div className="alert error">{mutation.error instanceof Error ? mutation.error.message : 'Cấu hình chưa hợp lệ'}</div>}
  </div>
}
