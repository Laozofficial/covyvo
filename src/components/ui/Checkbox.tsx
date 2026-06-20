'use client'

import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, error, id, className = '', ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? rest.name ?? autoId

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="flex items-start gap-2.5 cursor-pointer select-none"
      >
        <span className="relative inline-flex shrink-0 mt-[1px]">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={[
              'peer appearance-none h-[18px] w-[18px] rounded-md border bg-white cursor-pointer',
              'transition-colors',
              error
                ? 'border-red-400'
                : 'border-ink-300 hover:border-ink-400',
              'checked:bg-brand-600 checked:border-brand-600',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...rest}
          />
          <svg
            className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="text-[12.5px] leading-snug text-ink-700 font-medium">
          {label}
        </span>
      </label>
      {error && <p className="text-xs text-red-600 pl-7">{error}</p>}
    </div>
  )
})
