'use client'

import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

export type ComboboxOption = { value: string; label: string; hint?: string; disabled?: boolean }

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  icon?: ReactNode
  error?: string
  hint?: string
  disabled?: boolean
  placeholder?: string
  /** Show the inline search input. Default true. Pass `false` for very short
   *  option lists where a search box would be overkill. */
  searchable?: boolean
  name?: string
}

/**
 * Custom searchable select. Drop-in replacement for native `<select>` —
 * same {label, value, onChange, options, icon, error, hint} API as the
 * legacy SelectField, plus a built-in search box.
 *
 * - Click the trigger to open the popover; search auto-focuses.
 * - Type to filter options by label or value substring (case-insensitive).
 * - ↑/↓ to navigate, Enter to select, Esc to close.
 * - Click anywhere outside to close.
 */
export function Combobox({
  label,
  value,
  onChange,
  options,
  icon,
  error,
  hint,
  disabled,
  placeholder,
  searchable = true,
  name,
}: Props) {
  const autoId = useId()
  const triggerId = name ?? autoId
  const popoverId = `${triggerId}-popover`

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    )
  }, [options, query])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Reset search + highlight when opening; focus search.
  useEffect(() => {
    if (!open) return
    setQuery('')
    const idx = Math.max(
      0,
      options.findIndex((o) => o.value === value),
    )
    setHighlight(idx)
    setTimeout(() => searchRef.current?.focus(), 0)
  }, [open, options, value])

  // Keep highlight inside the filtered range when search changes.
  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(Math.max(0, filtered.length - 1))
  }, [filtered.length, highlight])

  function pick(opt: ComboboxOption) {
    if (opt.disabled) return
    onChange(opt.value)
    setOpen(false)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(filtered.length - 1, h + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlight]
      if (opt) pick(opt)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  // Scroll the highlighted option into view.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-cbo-idx="${highlight}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  const showFloated = !!selected || open || !!placeholder

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      <div className="relative">
        {icon && (
          <span
            className={[
              'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 [&>svg]:h-4 [&>svg]:w-4',
              open ? 'text-brand-600' : 'text-ink-400',
            ].join(' ')}
          >
            {icon}
          </span>
        )}

        <button
          type="button"
          id={triggerId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={popoverId}
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={[
            'peer w-full text-left rounded-xl border bg-white text-[13.5px] font-medium',
            'h-12',
            icon ? 'pl-10' : 'pl-3.5',
            'pr-9',
            'focus:outline-none focus:ring-0 transition-all duration-150',
            disabled ? 'opacity-60 cursor-not-allowed bg-ink-50' : 'cursor-pointer',
            error
              ? 'border-red-400 focus:border-red-500'
              : open
                ? 'border-brand-600'
                : 'border-ink-200 hover:border-ink-300 focus:border-brand-600',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className={selected ? 'text-ink-900' : 'text-ink-400'}>
            {selected ? selected.label : placeholder ?? ''}
          </span>
        </button>

        <label
          htmlFor={triggerId}
          className={[
            'pointer-events-none absolute select-none bg-white px-1.5 transition-all duration-150',
            showFloated
              ? '-top-[7px] text-[11px] font-semibold tracking-wide'
              : 'top-1/2 -translate-y-1/2 text-[13.5px] font-medium',
            showFloated
              ? icon ? 'left-8' : 'left-2.5'
              : icon ? 'left-10' : 'left-3.5',
            error ? 'text-red-600' : open ? 'text-brand-600' : 'text-ink-500',
          ].join(' ')}
        >
          {label}
        </label>

        <svg
          className={[
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-transform duration-150',
            open ? 'rotate-180' : '',
          ].join(' ')}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>

        {open && (
          <div
            id={popoverId}
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded-xl border border-ink-200 bg-white shadow-[0_8px_30px_-8px_rgba(15,23,42,0.20)] overflow-hidden"
          >
            {searchable && (
              <div className="border-b border-ink-100 p-2">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search…"
                  className="w-full h-9 rounded-lg border border-ink-200 bg-white px-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
            <ul
              ref={listRef}
              className="max-h-[280px] overflow-y-auto py-1"
              onKeyDown={onKeyDown}
              tabIndex={-1}
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-[12px] text-ink-500">
                  No matches
                </li>
              ) : (
                filtered.map((opt, i) => {
                  const isActive = opt.value === value
                  const isHighlighted = i === highlight
                  return (
                    <li
                      key={`${opt.value}-${i}`}
                      data-cbo-idx={i}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(opt)}
                      className={[
                        'mx-1 px-2.5 py-2 rounded-lg text-[13px] flex items-center justify-between gap-2',
                        opt.disabled
                          ? 'text-ink-400 cursor-not-allowed'
                          : 'cursor-pointer',
                        !opt.disabled && isHighlighted
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-800',
                        isActive ? 'font-semibold' : 'font-medium',
                      ].join(' ')}
                    >
                      <span className="truncate">{opt.label}</span>
                      <span className="flex items-center gap-1.5">
                        {opt.hint && (
                          <span className="text-[10.5px] text-ink-500 font-medium">
                            {opt.hint}
                          </span>
                        )}
                        {isActive && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-brand-600"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-600 pl-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500 pl-1">{hint}</p>
      ) : null}
    </div>
  )
}
