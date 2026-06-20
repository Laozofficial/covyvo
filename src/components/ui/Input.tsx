'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, className = '', id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-red-400' : 'border-ink-200',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
})
