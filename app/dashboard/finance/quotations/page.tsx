'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { FileTextIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { Customer, customersApi } from '../../../../src/lib/business-api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  DocLineInput,
  Quotation,
  QuotationStatus,
  docStatusMeta,
  quotationsApi,
} from '../../../../src/lib/commercial-api'
import { DocFormDrawer } from '../_components/DocFormDrawer'

export default function QuotationsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<QuotationStatus | ''>('')
  const [drawer, setDrawer] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await quotationsApi.list({ status: status || undefined, limit: 100 })
      setItems(r.data ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load quotations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status])
  useEffect(() => { customersApi.list({ limit: 200 }).then((r) => setCustomers(r.data ?? [])).catch(() => {}) }, [])

  async function transition(q: Quotation, next: QuotationStatus) {
    setBusy(q.id)
    try {
      await quotationsApi.update(q.id, { status: next })
      await load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not update')
    } finally {
      setBusy(null)
    }
  }

  async function convert(q: Quotation) {
    setBusy(q.id)
    try {
      const r = await quotationsApi.convert(q.id)
      router.push(`/dashboard/finance/invoices`)
      void r
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not convert')
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Quotations"
        description="Proposals you send customers — convert to an invoice when accepted."
        actions={<Button onClick={() => setDrawer(true)}>New quotation</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value as QuotationStatus | '')} className="h-9 rounded-lg border border-ink-200 px-3 text-[12.5px] font-semibold">
          <option value="">All statuses</option>
          {['draft', 'sent', 'accepted', 'declined', 'expired', 'converted'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={<FileTextIcon />} title="No quotations yet" description="Create a quote to send a customer." action={<Button onClick={() => setDrawer(true)}>New quotation</Button>} />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th><th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((q) => (
                <tr key={q.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{q.reference}</td>
                  <td className="px-4 py-3 text-ink-700">{q.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600">{q.quoteDate}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(q.total, q.currency)}</td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${docStatusMeta(q.status).chip}`}>{q.status}</span></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {q.status === 'draft' && <button disabled={busy === q.id} onClick={() => transition(q, 'sent')} className="text-[12px] font-semibold text-sky-600 mr-3">Send</button>}
                    {q.status === 'sent' && <button disabled={busy === q.id} onClick={() => transition(q, 'accepted')} className="text-[12px] font-semibold text-emerald-600 mr-3">Accept</button>}
                    {(q.status === 'accepted' || q.status === 'sent') && <button disabled={busy === q.id} onClick={() => convert(q)} className="text-[12px] font-semibold text-brand-600">Convert to invoice</button>}
                    {q.status === 'converted' && <span className="text-[11px] text-ink-400">Invoiced</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawer && (
        <DocFormDrawer
          title="New quotation"
          customers={customers}
          dateLabel="Quote date"
          extraDateLabel="Valid until"
          onClose={() => setDrawer(false)}
          onSubmit={async (v) => {
            await quotationsApi.create({
              customerId: v.customerId,
              quoteDate: v.date,
              validUntil: v.extraDate || undefined,
              notes: v.notes || undefined,
              lines: v.lines,
            })
            setDrawer(false)
            await load()
          }}
        />
      )}
    </>
  )
}

function Spinner() {
  return <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" /></div>
}
