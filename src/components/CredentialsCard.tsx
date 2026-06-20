'use client'

import { useState } from 'react'

type Props = {
  email: string
  password: string
  title?: string
  hint?: string
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function CredentialsCard({
  email,
  password,
  title = 'Share these credentials',
  hint = 'The user will be required to set a new password on first sign-in.',
}: Props) {
  const [copied, setCopied] = useState<'email' | 'password' | 'both' | null>(null)

  async function copy(value: string, label: 'email' | 'password' | 'both') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore clipboard error */
    }
  }

  const combined = `Email: ${email}\nTemporary password: ${password}`

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[13.5px] font-bold text-ink-900">{title}</h3>
        {hint && <p className="text-[11.5px] text-ink-500 mt-0.5">{hint}</p>}
      </div>

      <div className="rounded-xl border border-ink-200 bg-white divide-y divide-ink-100">
        <Row
          label="Email"
          value={email}
          mono={false}
          copied={copied === 'email'}
          onCopy={() => copy(email, 'email')}
        />
        <Row
          label="Temporary password"
          value={password}
          mono
          copied={copied === 'password'}
          onCopy={() => copy(password, 'password')}
        />
      </div>

      <button
        type="button"
        onClick={() => copy(combined, 'both')}
        className={[
          'w-full inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors',
          copied === 'both'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700',
        ].join(' ')}
      >
        {copied === 'both' ? <CheckIcon /> : <CopyIcon />}
        {copied === 'both' ? 'Copied both fields' : 'Copy email + password'}
      </button>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  copied,
  onCopy,
}: {
  label: string
  value: string
  mono: boolean
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
          {label}
        </p>
        <p
          className={[
            'text-[13px] font-semibold text-ink-900 truncate',
            mono ? 'font-mono' : '',
          ].join(' ')}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        title={copied ? 'Copied!' : 'Copy'}
        className={[
          'shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11.5px] font-semibold transition-colors',
          copied
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800',
        ].join(' ')}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
