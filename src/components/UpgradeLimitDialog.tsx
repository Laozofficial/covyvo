'use client'

import Link from 'next/link'
import { LockClosedIcon } from './ui/icons'

/**
 * Shown when a tenant hits a plan cap (branches / users / employees) and tries
 * to create another. Urges an upgrade rather than silently failing at the API.
 */
export function UpgradeLimitDialog({
  open,
  onClose,
  resource,
  limit,
}: {
  open: boolean
  onClose: () => void
  /** Plural resource label, e.g. "branches", "users", "employees". */
  resource: string
  limit: number
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-brand-600 to-violet-700 px-7 pt-7 pb-8 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <span className="[&>svg]:h-5 [&>svg]:w-5"><LockClosedIcon size={20} /></span>
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-white/70">Plan limit reached</p>
          <h2 className="mt-1 text-[20px] font-bold leading-tight">
            You&apos;ve used all {limit} {resource}
          </h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-white/85">
            Your current plan includes {limit} {resource}. Upgrade to a higher plan to add more.
          </p>
        </div>
        <div className="px-7 py-5">
          <p className="text-[12.5px] text-ink-600">
            Higher plans raise your {resource} limit (and unlock Payroll, HR and tax compliance).
            You can also buy an add-on for extra capacity.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-brand-700"
            >
              Upgrade plan
            </Link>
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-xl border border-ink-200 px-4 py-2.5 text-[13px] font-semibold text-ink-700 hover:bg-ink-50"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
