import { useEffect, useRef, useState } from 'react'

type JsonValueEditorProps<T> = {
  label: string
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  rows?: number
  validate?: (value: unknown) => value is T
  validationMessage?: string
}

function format(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export function JsonValueEditor<T>({
  label,
  value,
  onChange,
  disabled = false,
  rows = 5,
  validate,
  validationMessage = 'JSON không đúng cấu trúc yêu cầu.',
}: JsonValueEditorProps<T>) {
  const serialized = format(value)
  const lastEmitted = useRef(serialized)
  const [draft, setDraft] = useState(serialized)
  const [error, setError] = useState('')

  useEffect(() => {
    if (serialized !== lastEmitted.current) {
      lastEmitted.current = serialized
      setDraft(serialized)
      setError('')
    }
  }, [serialized])

  return (
    <label>
      {label}
      <textarea
        className="code-editor"
        disabled={disabled}
        rows={rows}
        value={draft}
        onChange={(event) => {
          const nextDraft = event.target.value
          setDraft(nextDraft)
          try {
            const parsed: unknown = JSON.parse(nextDraft)
            if (validate && !validate(parsed)) {
              setError(validationMessage)
              return
            }
            setError('')
            lastEmitted.current = format(parsed)
            onChange(parsed as T)
          } catch {
            setError('JSON chưa hợp lệ. Dữ liệu hợp lệ gần nhất vẫn được giữ lại.')
          }
        }}
      />
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}
