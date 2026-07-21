'use client'

import { useMemo, useState } from 'react'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { ApiError } from '../../../../src/lib/api'
import type { Customer } from '../../../../src/lib/business-api'
import { formatMoney } from '../../../../src/lib/finance-api'
import type { DocLineInput } from '../../../../src/lib/commercial-api'

type LineRow = { description: string; quantity: string; unitPrice: string; taxRate: string }

export type DocFormValue = {
  customerId: string
  date: string
  extraDate: string
  notes: string
  lines: DocLineInput[]
}

const today = () => new Date().toISOString().slice(0, 10)

export function DocFormDrawer({
  title,
  customers,
  dateLabel,
  extraDateLabel,
  reasonField,
  onClose,
  onSubmit,
}: {
  title: string
  customers: Customer[]
  dateLabel: string
  extraDateLabel?: string
  reasonField?: boolean
  onClose: () => void
  onSubmit: (v: DocFormValue & { reason?: string }) => Promise<void>
}) {
  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState(today())
  const [extraDate, setExtraDate] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<LineRow[]>([{ description: '', quantity: '1', unitPrice: '', taxRate: '0' }])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const total = useMemo(
    () =>
      rows.reduce((s, r) => {
        const ls = (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0)
        return s + ls + ls * ((Number(r.taxRate) || 0) / 100)
      }, 0),
    [rows],
  )

  function setRow(i: number, patch: Partial<LineRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  async function submit() {
    setErr(null)
    if (!customerId) return setErr('Select a customer.')
    const lines: DocLineInput[] = rows
      .filter((r) => r.description.trim() && Number(r.unitPrice) >= 0)
      .map((r) => ({
        description: r.description.trim(),
        quantity: Number(r.quantity) || 0,
        unitPrice: Number(r.unitPrice) || 0,
        // stored as a fraction on the backend (0.075 = 7.5%)
        taxRate: (Number(r.taxRate) || 0) / 100,
      }))
    if (lines.length === 0) return setErr('Add at least one line item.')
    setSaving(true)
    try {
      await onSubmit({ customerId, date, extraDate, notes, lines, reason: reason || undefined })
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save')
      setSaving(false)
    }
  }

  const input = 'w-full h-9 rounded-lg border border-ink-200 px-2.5 text-[12.5px] focus:outline-none focus:border-brand-500'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[min(560px,100vw)] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
          <h3 className="font-bold text-ink-900">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-ink-400 hover:text-ink-700">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {err && <Alert variant="error">{err}</Alert>}

          <label className="block">
            <span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Customer</span>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={input}>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11.5px] font-semibold text-ink-600 mb-1">{dateLabel}</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            </label>
            {extraDateLabel && (
              <label className="block">
                <span className="block text-[11.5px] font-semibold text-ink-600 mb-1">{extraDateLabel}</span>
                <input type="date" value={extraDate} onChange={(e) => setExtraDate(e.target.value)} className={input} />
              </label>
            )}
          </div>

          {reasonField && (
            <label className="block">
              <span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Reason</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Returned goods" className={input} />
            </label>
          )}

          <div>
            <div className="text-[11.5px] font-semibold text-ink-600 mb-1">Line items</div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_60px_90px_60px_28px] gap-1.5 text-[10px] font-bold uppercase text-ink-400 px-0.5">
                <span>Description</span><span>Qty</span><span>Unit price</span><span>Tax %</span><span />
              </div>
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_90px_60px_28px] gap-1.5">
                  <input value={r.description} onChange={(e) => setRow(i, { description: e.target.value })} placeholder="Item" className={input} />
                  <input value={r.quantity} onChange={(e) => setRow(i, { quantity: e.target.value })} inputMode="decimal" className={`${input} text-right`} />
                  <input value={r.unitPrice} onChange={(e) => setRow(i, { unitPrice: e.target.value })} inputMode="decimal" className={`${input} text-right`} />
                  <input value={r.taxRate} onChange={(e) => setRow(i, { taxRate: e.target.value })} inputMode="decimal" className={`${input} text-right`} />
                  <button onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} className="text-ink-400 hover:text-rose-600 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
            <button onClick={() => setRows((rs) => [...rs, { description: '', quantity: '1', unitPrice: '', taxRate: '0' }])} className="mt-1.5 text-[12px] font-semibold text-brand-600">+ Add line</button>
          </div>

          <label className="block">
            <span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-ink-200 px-2.5 py-2 text-[12.5px] focus:outline-none focus:border-brand-500" />
          </label>
        </div>

        <div className="px-5 py-4 border-t border-ink-200 flex items-center gap-3">
          <span className="text-[13px] font-bold text-ink-900">Total: {formatMoney(total)}</span>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button loading={saving} onClick={submit}>Save</Button>
          </div>
        </div>
      </div>
    </>
  )
}
