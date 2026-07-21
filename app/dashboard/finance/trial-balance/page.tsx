'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { BookIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { TrialBalance, reportsApi } from '../../../../src/lib/reports-api'

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    reportsApi
      .trialBalance()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load trial balance'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title="Trial Balance"
        description={data ? `As of ${data.asOf}` : 'Debit vs credit balance across all accounts'}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : !data || data.rows.length === 0 ? (
        <EmptyState icon={<BookIcon />} title="No posted entries" description="Post some journal entries and they'll roll up here." />
      ) : (
        <>
          <div className="mb-4">
            <Alert variant={data.balanced ? 'success' : 'error'}>
              {data.balanced
                ? `In balance — debits equal credits at ${formatMoney(data.totals.debit)}.`
                : `Out of balance — debits ${formatMoney(data.totals.debit)} vs credits ${formatMoney(data.totals.credit)}.`}
            </Alert>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.rows.map((r) => (
                  <tr key={r.accountId} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] text-ink-600">{r.code}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{r.name}</td>
                    <td className="px-4 py-3 text-[11px] capitalize text-ink-500">{r.accountType}</td>
                    <td className="px-4 py-3 text-right font-mono">{Number(r.debit) ? formatMoney(r.debit) : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{Number(r.credit) ? formatMoney(r.credit) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-200 text-[12.5px] font-bold">
                  <td className="px-4 py-3" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-right font-mono">{formatMoney(data.totals.debit)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatMoney(data.totals.credit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  )
}
