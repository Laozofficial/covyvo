'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import {
  BranchIcon,
  BuildingIcon,
  CalendarIcon,
  FileTextIcon,
  TagIcon,
} from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Customer, customersApi } from '../../../../../src/lib/business-api'
import { Branch, Department, branchesApi, departmentsApi } from '../../../../../src/lib/hr-api'
import { formatMoney } from '../../../../../src/lib/finance-api'
import { Product, productsApi } from '../../../../../src/lib/procurement-api'
import { Invoice, invoicesApi } from '../../../../../src/lib/invoices-api'
import { QuickAddCustomerDrawer } from './QuickAddCustomerDrawer'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Invoice | null
  onSaved: (i: Invoice) => void
}

type DraftLine = {
  productId: string
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

const empty = (): DraftLine => ({
  productId: '',
  description: '',
  quantity: '1',
  unitPrice: '',
  taxRate: '0',
})

export function InvoiceFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [customers, setCustomers] = useState<Customer[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const [customerId, setCustomerId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [paymentTermsDays, setPaymentTermsDays] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([empty()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    Promise.allSettled([
      customersApi.list({ limit: 200 }),
      branchesApi.list({ limit: 200 }),
      departmentsApi.list({ limit: 200 }),
      productsApi.list({ limit: 200 }),
    ]).then(([c, b, d, p]) => {
      if (c.status === 'fulfilled') setCustomers(c.value.data ?? [])
      if (b.status === 'fulfilled') setBranches(b.value.data ?? [])
      if (d.status === 'fulfilled') setDepartments(d.value.data ?? [])
      if (p.status === 'fulfilled') setProducts(p.value.data ?? [])
      // Surface lookup failures instead of rendering silently-empty dropdowns.
      const failed = [
        c.status === 'rejected' ? 'customers' : null,
        b.status === 'rejected' ? 'branches' : null,
        d.status === 'rejected' ? 'departments' : null,
        p.status === 'rejected' ? 'products' : null,
      ].filter(Boolean)
      if (failed.length) {
        console.error('Invoice lookups failed', { c, b, d, p })
        setError(`Could not load ${failed.join(', ')}. Refresh and try again.`)
      }
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    if (initial) {
      setCustomerId(initial.customerId)
      setBranchId(initial.branchId ?? '')
      setDepartmentId(initial.departmentId ?? '')
      setIssueDate(initial.issueDate)
      setDueDate(initial.dueDate)
      setPaymentTermsDays(initial.paymentTermsDays != null ? String(initial.paymentTermsDays) : '')
      setCurrency(initial.currency)
      setNotes(initial.notes ?? '')
      setLines(initial.lines.map((l) => ({
        productId: l.productId ?? '',
        description: l.description,
        quantity: String(Number(l.quantity)),
        unitPrice: String(Number(l.unitPrice)),
        taxRate: String(Number(l.taxRate)),
      })))
    } else {
      setCustomerId(''); setBranchId(''); setDepartmentId('')
      setIssueDate(new Date().toISOString().slice(0, 10))
      setDueDate('')
      setPaymentTermsDays('')
      setCurrency('NGN'); setNotes('')
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
      unitPrice: p?.salePrice ? String(Number(p.salePrice)) : l.unitPrice,
      taxRate: p?.vatRate ? String(Number(p.vatRate)) : l.taxRate,
    }))
  }

  function pickCustomer(id: string) {
    setCustomerId(id)
    const c = customers.find((x) => x.id === id)
    if (c) {
      if (c.paymentTermsDays != null) setPaymentTermsDays(String(c.paymentTermsDays))
      if (c.currency) setCurrency(c.currency)
    }
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

  const paid = editing ? Number(initial!.paidAmount) : 0
  const locked = editing && (paid > 0 || initial!.status === 'paid' || initial!.status === 'void')

  const canSubmit = customerId && lines.length > 0
    && lines.every((l) => l.description.trim() && Number(l.quantity) > 0 && Number(l.unitPrice) >= 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const payload = {
        customerId,
        branchId: branchId || undefined,
        departmentId: departmentId || undefined,
        issueDate,
        dueDate: dueDate || undefined,
        paymentTermsDays: paymentTermsDays === '' ? undefined : Number(paymentTermsDays),
        currency: currency.toUpperCase(),
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
        ? await invoicesApi.update(initial!.id, payload)
        : await invoicesApi.create(payload)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save invoice')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        defaultSize="expanded"
        title={editing ? `Edit ${initial!.reference}` : 'New invoice'}
        description={
          locked
            ? 'This invoice has payments (or is closed) — the header and lines are read-only.'
            : 'Bill a customer for goods or services. Send when ready to release to the customer.'
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
            <Button type="submit" form="invoice-form" loading={busy} disabled={!canSubmit || locked}>
              {editing ? 'Save changes' : 'Create draft'}
            </Button>
          </div>
        }
      >
        {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
        <form id="invoice-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <SelectField
                  label="Customer *"
                  value={customerId}
                  onChange={(e) => pickCustomer(e.target.value)}
                  disabled={locked}
                  options={[
                    { value: '', label: '— select customer —' },
                    ...customers.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` })),
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(true)}
                disabled={locked}
                className="h-12 shrink-0 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-60"
              >
                + Add
              </button>
            </div>
            <SelectField
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={(['NGN', 'USD', 'EUR', 'GBP'] as const).map((c) => ({ value: c, label: c }))}
            />
            <TextField
              label="Payment terms (days)"
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(e.target.value.replace(/[^\d]/g, ''))}
              icon={<TagIcon />}
              hint="e.g. 30"
              disabled={locked}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TextField
              label="Issue date *"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              icon={<CalendarIcon />}
              disabled={locked}
            />
            <TextField
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              icon={<CalendarIcon />}
              hint={paymentTermsDays ? `defaults to issue + ${paymentTermsDays}d` : undefined}
              disabled={locked}
            />
            <SelectField
              label="Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              icon={<BranchIcon />}
              options={[
                { value: '', label: '— none —' },
                ...branches.map((b) => ({ value: b.id, label: `${b.code} · ${b.name}` })),
              ]}
            />
          </div>

          <SelectField
            label="Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            icon={<BuildingIcon />}
            options={[
              { value: '', label: '— none —' },
              ...departments.map((d) => ({ value: d.id, label: `${d.code} · ${d.name}` })),
            ]}
          />

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
                          placeholder="e.g. Consulting hours, October"
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

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            icon={<FileTextIcon />}
            hint="e.g. Bank details, PO reference, delivery instructions"
          />

          {editing && initial!.payments.length > 0 && (
            <div className="rounded-xl border border-ink-200 overflow-hidden">
              <div className="px-3 py-2 bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                Payments · {formatMoney(initial!.paidAmount, currency)} received
              </div>
              <ul className="divide-y divide-ink-100">
                {initial!.payments.map((p) => (
                  <li key={p.id} className={`px-3 py-2 flex items-center justify-between text-[12px] ${p.voidedAt ? 'opacity-50 line-through' : ''}`}>
                    <div>
                      <p className="font-semibold text-ink-900">{formatMoney(p.amount, currency)}</p>
                      <p className="text-[11px] text-ink-500">
                        {p.paymentDate} · {p.method}
                        {p.reference && <> · <span className="font-mono">{p.reference}</span></>}
                      </p>
                    </div>
                    {!p.voidedAt && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Void this payment?')) return
                          try {
                            const saved = await invoicesApi.voidPayment(initial!.id, p.id)
                            onSaved(saved)
                          } catch (err) {
                            alert(err instanceof ApiError ? err.message : 'Could not void payment')
                          }
                        }}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Void
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </Drawer>

      <QuickAddCustomerDrawer
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreated={(c) => {
          setCustomers((prev) => [c, ...prev])
          setCustomerId(c.id)
          if (c.currency) setCurrency(c.currency)
          if (c.paymentTermsDays != null) setPaymentTermsDays(String(c.paymentTermsDays))
        }}
      />
    </>
  )
}
