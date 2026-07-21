'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { CartIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  AccountsPayable,
  BUCKET_LABELS,
  reportsApi,
} from '../../../../src/lib/reports-api'

export default function AccountsPayablePage() {
  const [data, setData] = useState<AccountsPayable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    reportsApi
      .accountsPayable()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load payables'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title="Accounts Payable"
        description={data ? `${data.count} open order${data.count === 1 ? '' : 's'} · as of ${data.asOf}` : 'Money you owe to vendors'}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      {loading ? (
        <Spinner />
      ) : !data || data.rows.length === 0 ? (
        <EmptyState icon={<CartIcon />} title="Nothing payable" description="No open purchase orders awaiting payment." />
      ) : (
        <>
          {data.note && <div className="mb-4"><Alert variant="info">{data.note}</Alert></div>}

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            {(Object.keys(BUCKET_LABELS) as (keyof typeof BUCKET_LABELS)[]).map((b) => (
              <Tile key={b} label={BUCKET_LABELS[b]} value={formatMoney(data.buckets[b])} danger={b === 'd90_plus'} />
            ))}
            <Tile label="Total owed" value={formatMoney(data.total)} accent />
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">PO</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Order date</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.rows.map((r) => (
                  <tr key={r.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{r.reference}</td>
                    <td className="px-4 py-3 text-ink-700">{r.vendor ?? '—'}</td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600">{r.orderDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${r.bucket === 'current' ? 'bg-ink-100 text-ink-600' : r.bucket === 'd90_plus' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        {BUCKET_LABELS[r.bucket]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(r.outstanding, r.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

function Spinner() {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
    </div>
  )
}

function Tile({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${accent ? 'border-brand-200 bg-brand-50' : danger ? 'border-rose-200 bg-rose-50/50' : 'border-ink-200 bg-white'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`mt-1 text-[15px] font-bold ${accent ? 'text-brand-700' : danger ? 'text-rose-700' : 'text-ink-900'}`}>{value}</div>
    </div>
  )
}
