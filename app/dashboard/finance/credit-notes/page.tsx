'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { FileTextIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { Customer, customersApi } from '../../../../src/lib/business-api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  CreditNote,
  CreditNoteStatus,
  creditNotesApi,
  docStatusMeta,
} from '../../../../src/lib/commercial-api'
import { DocFormDrawer } from '../_components/DocFormDrawer'

export default function CreditNotesPage() {
  const [items, setItems] = useState<CreditNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<CreditNoteStatus | ''>('')
  const [drawer, setDrawer] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await creditNotesApi.list({ status: status || undefined, limit: 100 })
      setItems(r.data ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load credit notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status])
  useEffect(() => { customersApi.list({ limit: 200 }).then((r) => setCustomers(r.data ?? [])).catch((e) => console.error('Failed to load customers', e)) }, [])

  async function transition(n: CreditNote, next: CreditNoteStatus) {
    setBusy(n.id)
    try {
      await creditNotesApi.update(n.id, { status: next })
      await load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not update')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Credit Notes"
        description="Refunds and adjustments that reduce what a customer owes."
        actions={<Button onClick={() => setDrawer(true)}>New credit note</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value as CreditNoteStatus | '')} className="h-9 rounded-lg border border-ink-200 px-3 text-[12.5px] font-semibold">
          <option value="">All statuses</option>
          {['draft', 'issued', 'applied', 'void'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={<FileTextIcon />} title="No credit notes yet" description="Issue a credit note against a customer or invoice." action={<Button onClick={() => setDrawer(true)}>New credit note</Button>} />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th><th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th><th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((n) => (
                <tr key={n.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{n.reference}</td>
                  <td className="px-4 py-3 text-ink-700">{n.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600">{n.issueDate}</td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-500">{n.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600">{formatMoney(n.total, n.currency)}</td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${docStatusMeta(n.status).chip}`}>{n.status}</span></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {n.status === 'draft' && <button disabled={busy === n.id} onClick={() => transition(n, 'issued')} className="text-[12px] font-semibold text-sky-600 mr-3">Issue</button>}
                    {n.status === 'issued' && <button disabled={busy === n.id} onClick={() => transition(n, 'applied')} className="text-[12px] font-semibold text-emerald-600">Mark applied</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawer && (
        <DocFormDrawer
          title="New credit note"
          customers={customers}
          dateLabel="Issue date"
          reasonField
          onClose={() => setDrawer(false)}
          onSubmit={async (v) => {
            await creditNotesApi.create({
              customerId: v.customerId,
              issueDate: v.date,
              reason: v.reason || undefined,
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
