'use client'

import { ReactNode, SelectHTMLAttributes, forwardRef, useId } from 'react'

type Option = { value: string; label: string }
type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  hint?: string
  icon?: ReactNode
  options: Option[]
}

export const SelectField = forwardRef<HTMLSelectElement, Props>(function SelectField(
  { label, error, hint, icon, options, className = '', id, ...rest },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? rest.name ?? autoId

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 peer-focus:text-brand-600 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}

        <select
          ref={ref}
          id={selectId}
          className={[
            'peer block w-full appearance-none rounded-xl border bg-white text-[13.5px] font-medium text-ink-900',
            'h-12',
            icon ? 'pl-10' : 'pl-3.5',
            'pr-9',
            'focus:outline-none focus:ring-0 transition-all duration-150',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-ink-200 hover:border-ink-300 focus:border-brand-600',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Select always shows a value, so label stays floated */}
        <label
          htmlFor={selectId}
          className={[
            'pointer-events-none absolute select-none bg-white px-1.5',
            '-top-[7px] text-[11px] font-semibold tracking-wide',
            icon ? 'left-8' : 'left-2.5',
            error ? 'text-red-600' : 'text-ink-500',
            'peer-focus:text-brand-600',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </label>

        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
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
      </div>
      {error ? (
        <p className="text-xs text-red-600 pl-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500 pl-1">{hint}</p>
      ) : null}
    </div>
  )
})
