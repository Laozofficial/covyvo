'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'

type Option = { value: string; label: string }
type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  hint?: string
  options: Option[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, hint, options, placeholder, className = '', id, ...rest },
  ref,
) {
  const selectId = id ?? rest.name
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={[
          'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-red-400' : 'border-ink-200',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
})
