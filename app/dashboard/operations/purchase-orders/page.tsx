'use client'

import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { CartIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { Vendor, vendorsApi } from '../../../../src/lib/business-api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  poStatusMeta,
  purchaseOrdersApi,
} from '../../../../src/lib/procurement-api'
import { PurchaseOrderFormDrawer } from './_components/PurchaseOrderFormDrawer'

const STATUS_FILTERS: { value: PurchaseOrderStatus | ''; label: string }[] = [
  { value: '',                   label: 'All statuses' },
  { value: 'draft',              label: 'Draft' },
  { value: 'sent',               label: 'Sent' },
  { value: 'partially_received', label: 'Partially received' },
  { value: 'received',           label: 'Received' },
  { value: 'closed',             label: 'Closed' },
  { value: 'void',               label: 'Void' },
]

export default function PurchaseOrdersPage() {
  const [items, setItems] = useState<PurchaseOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrder | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await purchaseOrdersApi.list({
        search: search || undefined,
        status: status || undefined,
        limit: 100,
      })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load POs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    vendorsApi.list({ limit: 200 }).then((r) => setVendors(r.data ?? [])).catch(() => {})
  }, [])
  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  const vendorById = useMemo(
    () => new Map(vendors.map((v) => [v.id, v])),
    [vendors],
  )

  function handleSaved(po: PurchaseOrder) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === po.id)
      if (i >= 0) { const next = [...prev]; next[i] = po; return next }
      return [po, ...prev]
    })
  }

  async function transition(po: PurchaseOrder, next: PurchaseOrderStatus) {
    try {
      const saved = await purchaseOrdersApi.update(po.id, { status: next })
      handleSaved(saved)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not change status')
    }
  }

  return (
    <>
      <PageHeader
        title="Purchase orders"
        description={`${total.toLocaleString()} POs total`}
        actions={
          <Button onClick={() => { setEditing(null); setDrawerOpen(true) }} disabled={vendors.length === 0}>
            New PO
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      {vendors.length === 0 && !loading && (
        <div className="mb-4"><Alert variant="info">Add at least one vendor before raising a PO.</Alert></div>
      )}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by reference…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PurchaseOrderStatus | '')}
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
          icon={<CartIcon />}
          title={search || status ? 'No matches' : 'No purchase orders yet'}
          description={search || status ? 'Try clearing filters above.' : 'Raise your first PO to a vendor.'}
          action={!search && !status && vendors.length > 0 ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>New PO</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Order date</th>
                <th className="px-4 py-3 text-right">Lines</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((po) => {
                const meta = poStatusMeta(po.status)
                const vendor = vendorById.get(po.vendorId)
                return (
                  <tr key={po.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{po.reference}</td>
                    <td className="px-4 py-3">
                      {vendor ? (
                        <Link
                          href={`/dashboard/operations/vendors`}
                          className="font-semibold text-ink-900 hover:text-brand-700"
                        >
                          {vendor.name}
                        </Link>
                      ) : (
                        <span className="text-ink-400 font-mono">{po.vendorId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{po.orderDate}</td>
                    <td className="px-4 py-3 text-right font-mono">{po.lines?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(po.total, po.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {po.status === 'draft' && (
                        <button onClick={() => transition(po, 'sent')} className="text-[12px] font-semibold text-sky-600 hover:text-sky-700 mr-3">Send</button>
                      )}
                      {(po.status === 'sent' || po.status === 'partially_received') && (
                        <Link
                          href={`/dashboard/operations/goods-receipts?orderId=${po.id}`}
                          className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 mr-3"
                        >
                          Receive
                        </Link>
                      )}
                      <button
                        onClick={() => { setEditing(po); setDrawerOpen(true) }}
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

      <PurchaseOrderFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
