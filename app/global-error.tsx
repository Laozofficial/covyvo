'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary that catches errors in the root layout itself.
 * Next.js requires this file to render its own <html>/<body> because
 * the normal layout is what crashed.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global error boundary]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 460,
            width: '100%',
            margin: 16,
            padding: 32,
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            textAlign: 'center',
            boxShadow: '0 4px 30px -12px rgba(15,23,42,0.12)',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#E11D48',
              margin: 0,
            }}
          >
            Application crashed
          </p>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#0F172A',
              marginTop: 8,
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}
          >
            We hit an unrecoverable error
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Refresh the browser to try again.
          </p>
          {error.digest && (
            <p
              style={{
                display: 'inline-block',
                marginTop: 12,
                padding: '4px 8px',
                background: '#F1F5F9',
                borderRadius: 6,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10.5,
                color: '#475569',
              }}
            >
              ref: {error.digest}
            </p>
          )}
          <div style={{ marginTop: 24 }}>
            <button
              onClick={reset}
              style={{
                background: '#4F46E5',
                color: '#fff',
                fontWeight: 600,
                fontSize: 12.5,
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
