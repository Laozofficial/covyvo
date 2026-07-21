'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { BanknoteIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { Collections, reportsApi } from '../../../../src/lib/reports-api'

function monthStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function CollectionsPage() {
  const [data, setData] = useState<Collections | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await reportsApi.collections({ from, to }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  return (
    <>
      <PageHeader
        title="Collections"
        description="Payments received against customer invoices."
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-wrap items-center gap-3">
        <label className="text-[12px] font-semibold text-ink-600">From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-2 h-9 rounded-lg border border-ink-200 px-2 text-[12.5px]" />
        </label>
        <label className="text-[12px] font-semibold text-ink-600">To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-2 h-9 rounded-lg border border-ink-200 px-2 text-[12.5px]" />
        </label>
        {data && (
          <span className="ml-auto text-[12.5px] font-semibold text-ink-700">
            Collected: <span className="text-emerald-600">{formatMoney(data.total)}</span> · {data.count} payment{data.count === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : !data || data.rows.length === 0 ? (
        <EmptyState icon={<BanknoteIcon />} title="No collections in range" description="No invoice payments were recorded in this period." />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.rows.map((r) => (
                <tr key={r.id} className="text-[12.5px]">
                  <td className="px-4 py-3 text-[11.5px] text-ink-600 whitespace-nowrap">{r.paymentDate}</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{r.invoiceReference}</td>
                  <td className="px-4 py-3 text-ink-700">{r.customer ?? '—'}</td>
                  <td className="px-4 py-3 text-[11px] capitalize text-ink-500">{r.method.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-500">{r.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">{formatMoney(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
