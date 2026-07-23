'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
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
import { Vendor, vendorsApi } from '../../../../../src/lib/business-api'
import { Branch, branchesApi } from '../../../../../src/lib/hr-api'
import { formatMoney } from '../../../../../src/lib/finance-api'
import {
  Product,
  PurchaseOrder,
  productsApi,
  purchaseOrdersApi,
} from '../../../../../src/lib/procurement-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: PurchaseOrder | null
  onSaved: (po: PurchaseOrder) => void
}

type DraftLine = {
  productId: string
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

const empty = (): DraftLine => ({ productId: '', description: '', quantity: '1', unitPrice: '', taxRate: '0' })

export function PurchaseOrderFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [vendorId, setVendorId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [expectedDate, setExpectedDate] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [paymentTermsDays, setPaymentTermsDays] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([empty()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lazy load the three lookups when drawer opens.
  useEffect(() => {
    if (!open) return
    Promise.allSettled([
      vendorsApi.list({ limit: 200 }),
      branchesApi.list({ limit: 200 }),
      productsApi.list({ limit: 200 }),
    ]).then(([v, b, p]) => {
      if (v.status === 'fulfilled') setVendors(v.value.data ?? [])
      if (b.status === 'fulfilled') setBranches(b.value.data ?? [])
      if (p.status === 'fulfilled') setProducts(p.value.data ?? [])
      // Surface lookup failures instead of rendering silently-empty dropdowns.
      const failed = [
        v.status === 'rejected' ? 'vendors' : null,
        b.status === 'rejected' ? 'branches' : null,
        p.status === 'rejected' ? 'products' : null,
      ].filter(Boolean)
      if (failed.length) {
        console.error('PO lookups failed', { v, b, p })
        setError(`Could not load ${failed.join(', ')}. Refresh and try again.`)
      }
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    if (initial) {
      setVendorId(initial.vendorId)
      setBranchId(initial.branchId ?? '')
      setOrderDate(initial.orderDate)
      setExpectedDate(initial.expectedDate ?? '')
      setCurrency(initial.currency)
      setPaymentTermsDays(initial.paymentTermsDays != null ? String(initial.paymentTermsDays) : '')
      setNotes(initial.notes ?? '')
      setLines(initial.lines.map((l) => ({
        productId: l.productId ?? '',
        description: l.description,
        quantity: String(Number(l.quantity)),
        unitPrice: String(Number(l.unitPrice)),
        taxRate: String(Number(l.taxRate)),
      })))
    } else {
      setVendorId(''); setBranchId(''); setOrderDate(new Date().toISOString().slice(0, 10))
      setExpectedDate(''); setCurrency('NGN'); setPaymentTermsDays(''); setNotes('')
      setLines([empty()])
    }
    setError(null)
  }, [open, initial])

  function pickProductForLine(i: number, productId: string) {
    const p = products.find((x) => x.id === productId)
    setLines((prev) => prev.map((l, idx) => idx !== i ? l : {
      ...l,
      productId,
      description: p ? p.name : l.description,
      unitPrice: p?.purchasePrice ? String(Number(p.purchasePrice)) : l.unitPrice,
      taxRate: p?.vatRate ? String(Number(p.vatRate)) : l.taxRate,
    }))
  }

  const totals = useMemo(() => {
    let sub = 0; let tax = 0
    for (const l of lines) {
      const q = Number(l.quantity) || 0
      const up = Number(l.unitPrice) || 0
      const tr = Number(l.taxRate) || 0
      const ls = q * up
      sub += ls
      tax += ls * tr
    }
    return { subtotal: sub, taxTotal: tax, total: sub + tax }
  }, [lines])

  const canSubmit = vendorId && lines.length > 0
    && lines.every((l) => l.description.trim() && Number(l.quantity) > 0 && Number(l.unitPrice) >= 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const payload = {
        vendorId,
        branchId: branchId || undefined,
        orderDate,
        expectedDate: expectedDate || undefined,
        currency: currency.toUpperCase(),
        paymentTermsDays: paymentTermsDays === '' ? undefined : Number(paymentTermsDays),
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          productId: l.productId || null,
          description: l.description.trim(),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate) || 0,
        })),
      }
      const saved = editing
        ? await purchaseOrdersApi.update(initial!.id, payload)
        : await purchaseOrdersApi.create(payload)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save purchase order')
    } finally {
      setBusy(false)
    }
  }

  const locked = editing && initial!.lines.some((l) => Number(l.receivedQuantity) > 0)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      defaultSize="expanded"
      title={editing ? `Edit ${initial!.reference}` : 'New purchase order'}
      description={
        locked
          ? 'Receipts already exist against this PO. Header & lines are read-only.'
          : 'Raise a PO to a vendor. Status starts as draft; send when ready.'
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-mono">
            <span className="text-ink-500">Sub {formatMoney(totals.subtotal, currency)}</span>
            <span className="mx-2 text-ink-400">·</span>
            <span className="text-ink-500">Tax {formatMoney(totals.taxTotal, currency)}</span>
            <span className="mx-2 text-ink-400">·</span>
            <span className="font-semibold text-ink-900">Total {formatMoney(totals.total, currency)}</span>
          </div>
          <Button type="submit" form="po-form" loading={busy} disabled={!canSubmit || locked}>
            {editing ? 'Save changes' : 'Create PO'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="po-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectField
            label="Vendor *"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            disabled={locked}
            options={[
              { value: '', label: '— select vendor —' },
              ...vendors.map((v) => ({ value: v.id, label: `${v.code} · ${v.name}` })),
            ]}
          />
          <SelectField
            label="Receiving branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            icon={<BranchIcon />}
            options={[
              { value: '', label: '— none —' },
              ...branches.map((b) => ({ value: b.id, label: `${b.code} · ${b.name}` })),
            ]}
          />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. NGN" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TextField label="Order date *" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} icon={<CalendarIcon />} disabled={locked} />
          <TextField label="Expected delivery" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} icon={<CalendarIcon />} />
          <TextField label="Payment terms (days)" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value.replace(/[^\d]/g, ''))} icon={<TagIcon />} hint="e.g. 30" />
        </div>

        <div className="rounded-xl border border-ink-200 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-2 py-2 text-left w-[28%]">Product</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-right w-[80px]">Qty</th>
                <th className="px-2 py-2 text-right w-[100px]">Unit price</th>
                <th className="px-2 py-2 text-right w-[80px]">Tax</th>
                <th className="px-2 py-2 text-right w-[110px]">Line total</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {lines.map((l, i) => {
                const q = Number(l.quantity) || 0
                const up = Number(l.unitPrice) || 0
                const tr = Number(l.taxRate) || 0
                const lineTotal = q * up * (1 + tr)
                return (
                  <tr key={i}>
                    <td className="px-2 py-1">
                      <select
                        value={l.productId}
                        onChange={(e) => pickProductForLine(i, e.target.value)}
                        disabled={locked}
                        className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      >
                        <option value="">— free-form —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={l.description}
                        onChange={(e) => setLines((prev) => prev.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))}
                        placeholder="e.g. Office chair, mesh back"
                        disabled={locked}
                        className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={l.quantity}
                        onChange={(e) => setLines((prev) => prev.map((x, idx) => idx === i ? { ...x, quantity: e.target.value.replace(/[^\d.]/g, '') } : x))}
                        inputMode="decimal"
                        disabled={locked}
                        className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] font-mono text-right focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={l.unitPrice}
                        onChange={(e) => setLines((prev) => prev.map((x, idx) => idx === i ? { ...x, unitPrice: e.target.value.replace(/[^\d.]/g, '') } : x))}
                        placeholder="0.00"
                        inputMode="decimal"
                        disabled={locked}
                        className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] font-mono text-right focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={l.taxRate}
                        onChange={(e) => setLines((prev) => prev.map((x, idx) => idx === i ? { ...x, taxRate: e.target.value.replace(/[^\d.]/g, '') } : x))}
                        placeholder="0.075"
                        inputMode="decimal"
                        disabled={locked}
                        className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] font-mono text-right focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      />
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-[12px]">
                      {formatMoney(lineTotal, currency)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {lines.length > 1 && !locked && (
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-[11px] text-ink-500 hover:text-rose-600"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!locked && (
            <div className="px-3 py-2 border-t border-ink-100 bg-ink-50/40">
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, empty()])}
                className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
              >
                + Add line
              </button>
            </div>
          )}
        </div>

        <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} icon={<FileTextIcon />} hint="e.g. Deliver to receiving dock; payable on terms" />
      </form>
    </Drawer>
  )
}
