'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '../../src/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[dashboard error boundary]', error)
  }, [error])

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
        Something went wrong
      </p>
      <h1 className="mt-2 text-[18px] font-bold tracking-tight text-ink-900">
        This page hit an error
      </h1>
      <p className="mt-2 text-[12.5px] text-ink-500 max-w-md mx-auto">
        We logged the details. Try again, or head back to the dashboard home
        and pick a different module.
      </p>
      {error.digest && (
        <p className="mt-3 inline-block rounded-md bg-ink-100 px-2 py-1 font-mono text-[10.5px] text-ink-600">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-ink-200 text-ink-700 text-[12.5px] font-semibold hover:bg-ink-50 transition-colors"
        >
          Dashboard home
        </Link>
      </div>
    </div>
  )
}
