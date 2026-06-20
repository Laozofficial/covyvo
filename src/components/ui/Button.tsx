'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center font-semibold rounded-lg px-4 py-2.5 text-[13px] tracking-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary:
    'bg-ink-100 text-ink-800 hover:bg-ink-200 focus-visible:ring-ink-400',
  ghost:
    'bg-transparent text-ink-700 hover:bg-ink-100 focus-visible:ring-ink-300',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading, fullWidth, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[base, variants[variant], fullWidth ? 'w-full' : '', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Please wait…
        </span>
      ) : (
        children
      )}
    </button>
  )
})
