'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { FileTextIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { useActiveBranch } from '../../../../src/lib/useActiveBranch'
import { Invoice, InvoiceStatus, invoiceStatusMeta, invoicesApi } from '../../../../src/lib/invoices-api'
import { InvoiceFormDrawer } from './_components/InvoiceFormDrawer'
import { RecordPaymentDrawer } from './_components/RecordPaymentDrawer'

const STATUS_FILTERS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '',               label: 'All statuses' },
  { value: 'draft',          label: 'Draft' },
  { value: 'sent',           label: 'Sent' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'paid',           label: 'Paid' },
  { value: 'overdue',        label: 'Overdue' },
  { value: 'void',           label: 'Void' },
]

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { branchId } = useActiveBranch()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await invoicesApi.list({
        search: search || undefined,
        status: status || undefined,
        branchId: branchId || undefined,
        limit: 100,
      })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, branchId])

  const stats = useMemo(() => {
    let outstanding = 0
    let paid = 0
    for (const inv of items) {
      const p = Number(inv.paidAmount)
      const t = Number(inv.total)
      paid += p
      if (inv.status !== 'void') outstanding += Math.max(0, t - p)
    }
    return { outstanding, paid }
  }, [items])

  function handleSaved(i: Invoice) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === i.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = i; return next }
      return [i, ...prev]
    })
  }

  async function transition(inv: Invoice, next: InvoiceStatus) {
    try {
      const saved = await invoicesApi.update(inv.id, { status: next })
      handleSaved(saved)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not change status')
    }
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description={`${total.toLocaleString()} total · ${formatMoney(stats.outstanding, 'NGN')} outstanding`}
        actions={
          <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
            New invoice
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by reference or customer…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InvoiceStatus | '')}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon />}
          title={search || status ? 'No matches' : 'No invoices yet'}
          description={search || status ? 'Try clearing filters above.' : 'Bill your first customer for goods or services.'}
          action={!search && !status ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>New invoice</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((inv) => {
                const meta = invoiceStatusMeta(inv.status)
                const outstanding = Math.max(0, Number(inv.total) - Number(inv.paidAmount))
                return (
                  <tr key={inv.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{inv.reference}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      {inv.customer?.name ?? <span className="text-ink-400 font-mono">{inv.customerId.slice(0, 8)}…</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{inv.issueDate}</td>
                    <td className="px-4 py-3 text-ink-700">{inv.dueDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(inv.total, inv.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink-700">
                      {formatMoney(inv.paidAmount, inv.currency)}
                      {outstanding > 0 && inv.status !== 'void' && (
                        <p className="text-[10.5px] text-rose-600 font-semibold mt-0.5">
                          {formatMoney(outstanding, inv.currency)} due
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {inv.status === 'draft' && (
                        <button onClick={() => transition(inv, 'sent')} className="text-[12px] font-semibold text-sky-600 hover:text-sky-700 mr-3">Send</button>
                      )}
                      {(inv.status === 'sent' || inv.status === 'partially_paid' || inv.status === 'overdue') && (
                        <button onClick={() => setPayingInvoice(inv)} className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 mr-3">Record payment</button>
                      )}
                      <button
                        onClick={() => { setEditing(inv); setDrawerOpen(true) }}
                        className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />

      <RecordPaymentDrawer
        open={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        invoice={payingInvoice}
        onRecorded={(i) => { handleSaved(i); setPayingInvoice(null) }}
      />
    </>
  )
}
