import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-ink-50 px-4">
      <div className="max-w-md w-full rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-[0_4px_30px_-12px_rgba(15,23,42,0.12)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
          404
        </p>
        <h1 className="mt-2 text-[20px] font-bold tracking-tight text-ink-900">
          Page not found
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          The page you're looking for doesn't exist or has moved. Check the URL,
          or head back to the dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-brand-600 text-white text-[12.5px] font-semibold hover:bg-brand-700 transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-ink-200 text-ink-700 text-[12.5px] font-semibold hover:bg-ink-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
