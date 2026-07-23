'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import {
  BranchIcon,
  CalendarIcon,
  FileTextIcon,
  TagIcon,
} from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Branch, branchesApi } from '../../../../../src/lib/hr-api'
import {
  GoodsReceipt,
  PurchaseOrder,
  goodsReceiptsApi,
  purchaseOrdersApi,
} from '../../../../../src/lib/procurement-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: GoodsReceipt | null
  /** Pre-select a PO when opening from the PO list "Receive" link. */
  defaultOrderId?: string
  onSaved: (r: GoodsReceipt) => void
}

type DraftLine = {
  orderLineId: string
  description: string
  outstanding: number
  quantityReceived: string
  notes: string
}

export function GoodsReceiptFormDrawer({
  open,
  onClose,
  initial,
  defaultOrderId,
  onSaved,
}: Props) {
  const editing = !!initial
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  const [orderId, setOrderId] = useState('')
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [branchId, setBranchId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load eligible POs + branches when drawer opens.
  useEffect(() => {
    if (!open) return
    Promise.allSettled([
      purchaseOrdersApi.list({ limit: 200 }),
      branchesApi.list({ limit: 200 }),
    ]).then(([o, b]) => {
      if (o.status === 'fulfilled') {
        // Only POs that can still receive goods.
        const eligible = (o.value.data ?? []).filter(
          (po) => po.status === 'sent' || po.status === 'partially_received',
        )
        setOrders(eligible)
      }
      if (b.status === 'fulfilled') setBranches(b.value.data ?? [])
      // Surface lookup failures instead of rendering silently-empty dropdowns.
      const failed = [
        o.status === 'rejected' ? 'purchase orders' : null,
        b.status === 'rejected' ? 'branches' : null,
      ].filter(Boolean)
      if (failed.length) {
        console.error('Goods receipt lookups failed', { o, b })
        setError(`Could not load ${failed.join(', ')}. Refresh and try again.`)
      }
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    if (initial) {
      setOrderId(initial.orderId)
      setReceiptDate(initial.receiptDate)
      setBranchId(initial.branchId ?? '')
      setNotes(initial.notes ?? '')
      setLines(initial.lines.map((l) => ({
        orderLineId: l.orderLineId,
        description: l.description,
        outstanding: 0, // not editable post-create anyway
        quantityReceived: String(Number(l.quantityReceived)),
        notes: l.notes ?? '',
      })))
    } else {
      const initialOrderId = defaultOrderId ?? ''
      setOrderId(initialOrderId)
      setReceiptDate(new Date().toISOString().slice(0, 10))
      setBranchId('')
      setNotes('')
      setLines([])
    }
    setError(null)
  }, [open, initial, defaultOrderId])

  // When PO changes (only meaningful when creating), pull its current
  // outstanding lines so the user can fill in received quantities.
  useEffect(() => {
    if (editing || !open || !orderId) return
    purchaseOrdersApi.get(orderId).then((po) => {
      setBranchId(po.branchId ?? '')
      setLines(po.lines.map((l) => {
        const outstanding = Number(l.quantity) - Number(l.receivedQuantity)
        return {
          orderLineId: l.id,
          description: l.description,
          outstanding,
          quantityReceived: outstanding > 0 ? String(outstanding) : '0',
          notes: '',
        }
      }))
    }).catch(() => { /* leave empty */ })
  }, [orderId, open, editing])

  const canSubmit = orderId && lines.length > 0
    && lines.some((l) => Number(l.quantityReceived) > 0)
    && lines.every((l) => Number(l.quantityReceived) >= 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const payload = {
        orderId,
        receiptDate,
        branchId: branchId || undefined,
        notes: notes.trim() || undefined,
        lines: lines
          .filter((l) => Number(l.quantityReceived) > 0)
          .map((l) => ({
            orderLineId: l.orderLineId,
            quantityReceived: Number(l.quantityReceived),
            description: l.description.trim() || undefined,
            notes: l.notes.trim() || undefined,
          })),
      }
      const saved = editing
        ? await goodsReceiptsApi.update(initial!.id, payload)
        : await goodsReceiptsApi.create(payload)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save receipt')
    } finally {
      setBusy(false)
    }
  }

  const locked = editing && (initial!.status === 'confirmed' || initial!.status === 'void')

  return (
    <Drawer
      open={open}
      onClose={onClose}
      defaultSize="expanded"
      title={editing ? `Edit ${initial!.reference}` : 'New goods receipt'}
      description={
        locked
          ? `${initial!.status} receipts are read-only.`
          : 'Record what physically arrived against a purchase order.'
      }
      footer={
        <div className="flex items-center justify-end">
          <Button type="submit" form="grn-form" loading={busy} disabled={!canSubmit || locked}>
            {editing ? 'Save changes' : 'Create receipt'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="grn-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectField
            label="Purchase order *"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            disabled={editing}
            options={[
              { value: '', label: '— select PO —' },
              ...orders.map((o) => ({
                value: o.id,
                label: `${o.reference}`,
                hint: o.status,
              })),
            ]}
          />
          <TextField label="Receipt date *" type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} icon={<CalendarIcon />} disabled={locked} />
          <SelectField
            label="Received at branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            icon={<BranchIcon />}
            options={[
              { value: '', label: '— none —' },
              ...branches.map((b) => ({ value: b.id, label: `${b.code} · ${b.name}` })),
            ]}
          />
        </div>

        {lines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-white p-6 text-center text-[12.5px] text-ink-500">
            {orderId ? 'Loading PO lines…' : 'Pick a PO to load its outstanding lines.'}
          </div>
        ) : (
          <div className="rounded-xl border border-ink-200 overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-2 py-2 text-left">PO line</th>
                  {!editing && <th className="px-2 py-2 text-right w-[100px]">Outstanding</th>}
                  <th className="px-2 py-2 text-right w-[110px]">Receiving</th>
                  <th className="px-2 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {lines.map((l, i) => (
                  <tr key={l.orderLineId}>
                    <td className="px-2 py-2 max-w-[260px]">
                      <p className="font-semibold text-ink-900 truncate">{l.description}</p>
                    </td>
                    {!editing && (
                      <td className="px-2 py-2 text-right font-mono">{l.outstanding}</td>
                    )}
                    <td className="px-2 py-2">
                      <input
                        value={l.quantityReceived}
                        onChange={(e) => setLines((prev) => prev.map((x, idx) => idx === i ? { ...x, quantityReceived: e.target.value.replace(/[^\d.]/g, '') } : x))}
                        inputMode="decimal"
                        disabled={locked}
                        className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] font-mono text-right focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={l.notes}
                        onChange={(e) => setLines((prev) => prev.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x))}
                        placeholder="e.g. damaged box; missing 2 units"
                        disabled={locked}
                        className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TextField label="Receipt notes" value={notes} onChange={(e) => setNotes(e.target.value)} icon={<FileTextIcon />} hint="e.g. Goods inspected by Bola; packaging intact" />
        <p className="text-[11px] text-ink-500">
          Create as draft, then confirm from the receipts list to roll the
          received quantities up onto the PO.
        </p>
      </form>
    </Drawer>
  )
}
