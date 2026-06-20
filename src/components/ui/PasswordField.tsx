'use client'

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react'
import { EyeIcon, LockIcon } from './icons'
import { TextField } from './TextField'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField(
  { icon, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      ref={ref}
      {...rest}
      type={visible ? 'text' : 'password'}
      icon={icon ?? <LockIcon />}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="p-1 rounded-md text-ink-500 hover:text-ink-800 hover:bg-ink-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&>svg]:h-4 [&>svg]:w-4"
        >
          <EyeIcon open={visible} />
        </button>
      }
    />
  )
})
