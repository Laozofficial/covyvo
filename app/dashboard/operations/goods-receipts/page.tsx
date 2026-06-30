'use client'

import { useSearchParams } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { DownloadIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import {
  GoodsReceipt,
  GoodsReceiptStatus,
  goodsReceiptsApi,
  grnStatusMeta,
} from '../../../../src/lib/procurement-api'
import { GoodsReceiptFormDrawer } from './_components/GoodsReceiptFormDrawer'

const STATUS_FILTERS: { value: GoodsReceiptStatus | ''; label: string }[] = [
  { value: '',          label: 'All statuses' },
  { value: 'draft',     label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'void',      label: 'Void' },
]

export default function GoodsReceiptsPage() {
  const searchParams = useSearchParams()
  const presetOrderId = searchParams?.get('orderId') ?? undefined

  const [items, setItems] = useState<GoodsReceipt[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<GoodsReceiptStatus | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<GoodsReceipt | null>(null)

  // If we landed here with ?orderId=… (e.g. from a PO row's "Receive"
  // link), open the create drawer pre-pinned to that PO on first load.
  const [defaultOrderId, setDefaultOrderId] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (presetOrderId) {
      setDefaultOrderId(presetOrderId)
      setEditing(null)
      setDrawerOpen(true)
    }
    // Only fire from the initial query param value, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await goodsReceiptsApi.list({
        search: search || undefined,
        status: status || undefined,
        limit: 100,
      })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load receipts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  const counts = useMemo(() => {
    const by: Record<string, number> = {}
    for (const r of items) by[r.status] = (by[r.status] ?? 0) + 1
    return by
  }, [items])

  function handleSaved(r: GoodsReceipt) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === r.id)
      if (i >= 0) { const next = [...prev]; next[i] = r; return next }
      return [r, ...prev]
    })
  }

  async function transition(r: GoodsReceipt, next: GoodsReceiptStatus) {
    try {
      const saved = await goodsReceiptsApi.update(r.id, { status: next })
      handleSaved(saved)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not change status')
    }
  }

  return (
    <>
      <PageHeader
        title="Goods receipts"
        description={`${total.toLocaleString()} receipts · ${counts.confirmed ?? 0} confirmed · ${counts.draft ?? 0} drafts`}
        actions={
          <Button onClick={() => { setEditing(null); setDefaultOrderId(undefined); setDrawerOpen(true) }}>
            New receipt
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

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
          onChange={(e) => setStatus(e.target.value as GoodsReceiptStatus | '')}
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
          icon={<DownloadIcon />}
          title={search || status ? 'No matches' : 'No receipts yet'}
          description={search || status ? 'Try clearing filters above.' : 'Record what physically arrived against your purchase orders.'}
          action={!search && !status ? (
            <Button onClick={() => { setEditing(null); setDefaultOrderId(undefined); setDrawerOpen(true) }}>New receipt</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">PO</th>
                <th className="px-4 py-3">Receipt date</th>
                <th className="px-4 py-3 text-right">Lines</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((r) => {
                const meta = grnStatusMeta(r.status)
                return (
                  <tr key={r.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{r.reference}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-ink-700">
                      {r.order?.reference ?? <span className="text-ink-400">{r.orderId.slice(0, 8)}…</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{r.receiptDate}</td>
                    <td className="px-4 py-3 text-right font-mono">{r.lines?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {r.status === 'draft' && (
                        <>
                          <button onClick={() => transition(r, 'confirmed')} className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 mr-3">Confirm</button>
                          <button onClick={() => transition(r, 'void')} className="text-[12px] font-semibold text-rose-600 hover:text-rose-700 mr-3">Void</button>
                        </>
                      )}
                      {r.status === 'confirmed' && (
                        <button onClick={() => transition(r, 'void')} className="text-[12px] font-semibold text-rose-600 hover:text-rose-700 mr-3">Void</button>
                      )}
                      <button
                        onClick={() => { setEditing(r); setDefaultOrderId(undefined); setDrawerOpen(true) }}
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

      <GoodsReceiptFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); setDefaultOrderId(undefined) }}
        initial={editing}
        defaultOrderId={defaultOrderId}
        onSaved={handleSaved}
      />
    </>
  )
}
