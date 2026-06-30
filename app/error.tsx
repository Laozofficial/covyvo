'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[app error boundary]', error)
  }, [error])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-ink-50 px-4">
      <div className="max-w-md w-full rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-[0_4px_30px_-12px_rgba(15,23,42,0.12)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
          Something went wrong
        </p>
        <h1 className="mt-2 text-[20px] font-bold tracking-tight text-ink-900">
          The page hit an unexpected error
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          Try again — if it keeps happening, refresh the browser or head back
          to the dashboard.
        </p>
        {error.digest && (
          <p className="mt-3 inline-block rounded-md bg-ink-100 px-2 py-1 font-mono text-[10.5px] text-ink-600">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-brand-600 text-white text-[12.5px] font-semibold hover:bg-brand-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-ink-200 text-ink-700 text-[12.5px] font-semibold hover:bg-ink-50 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
