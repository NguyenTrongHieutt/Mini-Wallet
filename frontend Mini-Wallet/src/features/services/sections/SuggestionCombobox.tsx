import { useEffect, useMemo, useRef, useState } from 'react'

export type SuggestionOption = {
  value: string
  label: string
  description?: string
  keywords?: string
}

type SuggestionComboboxProps = {
  value: string
  options: SuggestionOption[]
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  normalizeInput?: (value: string) => string
}

export function SuggestionCombobox({
  value,
  options,
  onChange,
  placeholder = 'Nhập để tìm kiếm hoặc tự điền',
  emptyText = 'Không có gợi ý phù hợp. Bạn vẫn có thể tự nhập.',
  disabled,
  normalizeInput = (input) => input,
}: SuggestionComboboxProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setQuery(value), [value])
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('vi')
    if (!search) return options.slice(0, 30)
    return options.filter((option) =>
      `${option.value} ${option.label} ${option.description ?? ''} ${option.keywords ?? ''}`
        .toLocaleLowerCase('vi')
        .includes(search),
    ).slice(0, 30)
  }, [options, query])

  const select = (option: SuggestionOption) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setQuery(option.value)
    onChange(option.value)
    setOpen(false)
  }

  return <div className="suggestion-combobox">
    <input
      disabled={disabled}
      value={query}
      placeholder={placeholder}
      autoComplete="off"
      role="combobox"
      aria-expanded={open}
      aria-autocomplete="list"
      onFocus={() => setOpen(true)}
      onBlur={() => { closeTimer.current = setTimeout(() => setOpen(false), 120) }}
      onChange={(event) => {
        const next = normalizeInput(event.target.value)
        setQuery(next)
        onChange(next)
        setOpen(true)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
        if (event.key === 'ArrowDown') setOpen(true)
        if (event.key === 'Enter' && open && filtered.length === 1) {
          event.preventDefault()
          select(filtered[0])
        }
      }}
    />
    {open && !disabled && <div className="suggestion-menu" role="listbox">
      <div className="suggestion-menu-hint">Gõ để lọc hoặc chọn một gợi ý</div>
      {filtered.map((option) => <button
        type="button"
        role="option"
        aria-selected={option.value === value}
        className={option.value === value ? 'suggestion-option selected' : 'suggestion-option'}
        key={option.value}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => select(option)}
      >
        <span><strong>{option.label}</strong><small>{option.description ?? option.value}</small></span>
        <code>{option.value}</code>
      </button>)}
      {!filtered.length && <div className="suggestion-empty">{emptyText}</div>}
    </div>}
  </div>
}
