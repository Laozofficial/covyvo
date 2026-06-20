'use client'

import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  icon?: ReactNode
  endAdornment?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, hint, icon, endAdornment, className = '', id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? rest.name ?? autoId

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 peer-focus:text-brand-600 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          className={[
            'peer block w-full rounded-xl border bg-white text-[13.5px] font-medium text-ink-900',
            'h-12',
            icon ? 'pl-10' : 'pl-3.5',
            endAdornment ? 'pr-10' : 'pr-3.5',
            'placeholder-transparent',
            'focus:outline-none focus:ring-0',
            'transition-all duration-150',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-ink-200 hover:border-ink-300 focus:border-brand-600',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

        {/* Notched outline label — sits on the top border when floated */}
        <label
          htmlFor={inputId}
          className={[
            'pointer-events-none absolute select-none bg-white px-1.5',
            'transition-all duration-150',
            // Floated state (default — applies when input has content)
            '-top-[7px] text-[11px] font-semibold tracking-wide',
            icon ? 'left-8' : 'left-2.5',
            error ? 'text-red-600' : 'text-ink-500',
            // Unfloated state — only when placeholder is shown (input empty)
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[13.5px] peer-placeholder-shown:font-medium peer-placeholder-shown:tracking-normal peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-ink-400',
            icon
              ? 'peer-placeholder-shown:left-10'
              : 'peer-placeholder-shown:left-3.5',
            // Re-float on focus
            'peer-focus:-top-[7px] peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-wide peer-focus:bg-white',
            icon ? 'peer-focus:left-8' : 'peer-focus:left-2.5',
            error
              ? 'peer-focus:text-red-600'
              : 'peer-focus:text-brand-600',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </label>

        {endAdornment && (
          <div className="absolute inset-y-0 right-3 flex items-center text-ink-500">
            {endAdornment}
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
})
