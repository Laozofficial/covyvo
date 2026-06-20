'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { TextField } from '../../../../../src/components/ui/TextField'
import { CalendarIcon, FileTextIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import {
  Account,
  JournalEntry,
  formatMoney,
  journalsApi,
} from '../../../../../src/lib/finance-api'

type Props = {
  open: boolean
  onClose: () => void
  accounts: Account[]
  onSaved: (e: JournalEntry) => void
  initial?: JournalEntry | null
}

type DraftLine = { accountId: string; description: string; debit: string; credit: string }

const empty: DraftLine = { accountId: '', description: '', debit: '', credit: '' }

export function JournalFormDrawer({ open, onClose, accounts, onSaved, initial }: Props) {
  const editing = !!initial
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [memo, setMemo] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [lines, setLines] = useState<DraftLine[]>([{ ...empty }, { ...empty }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setEntryDate(initial.entryDate)
      setMemo(initial.memo)
      setCurrency(initial.currency)
      setLines(initial.lines.map((l) => ({
        accountId: l.accountId,
        description: l.description ?? '',
        debit: String(Number(l.debit) || ''),
        credit: String(Number(l.credit) || ''),
      })))
    } else {
      setEntryDate(new Date().toISOString().slice(0, 10))
      setMemo('')
      setCurrency('NGN')
      setLines([{ ...empty }, { ...empty }])
    }
    setError(null)
  }, [open, initial])

  const totals = useMemo(() => {
    let d = 0, c = 0
    for (const l of lines) { d += Number(l.debit) || 0; c += Number(l.credit) || 0 }
    return { debit: d, credit: c, balanced: Math.abs(d - c) < 0.005 && d > 0 }
  }, [lines])

  function updateLine(i: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const payload = {
        entryDate,
        memo: memo.trim(),
        currency: currency.toUpperCase(),
        lines: lines.map((l) => ({
          accountId: l.accountId,
          description: l.description.trim() || undefined,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })).filter((l) => l.accountId && (l.debit > 0 || l.credit > 0)),
      }
      const saved = editing
        ? await journalsApi.update(initial!.id, payload)
        : await journalsApi.create(payload)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save entry')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      defaultSize="expanded"
      title={editing ? `Edit ${initial!.reference}` : 'New journal entry'}
      description="Debits must equal credits."
      footer={
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-mono">
            <span className="text-ink-500">Dr {formatMoney(totals.debit, currency)}</span>
            <span className="mx-2 text-ink-400">·</span>
            <span className="text-ink-500">Cr {formatMoney(totals.credit, currency)}</span>
            {!totals.balanced && totals.debit + totals.credit > 0 && (
              <span className="ml-2 text-rose-600 font-semibold">Out of balance</span>
            )}
          </div>
          <Button type="submit" form="journal-form" loading={busy} disabled={!memo.trim() || !totals.balanced}>
            {editing ? 'Save changes' : 'Create entry'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="journal-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TextField label="Date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} icon={<CalendarIcon />} />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. NGN" />
          <TextField label="Memo" value={memo} onChange={(e) => setMemo(e.target.value)} icon={<FileTextIcon />} hint="e.g. June consulting invoice" />
        </div>

        <div className="rounded-xl border border-ink-200 overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-3 py-2 text-left">Account</th>
                <th className="px-3 py-2 text-left">Memo</th>
                <th className="px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Credit</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-2 py-1">
                    <select
                      value={l.accountId}
                      onChange={(e) => updateLine(i, { accountId: e.target.value })}
                      className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] focus:outline-none focus:border-brand-500"
                    >
                      <option value="">Pick account…</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={l.description}
                      onChange={(e) => updateLine(i, { description: e.target.value })}
                      placeholder="e.g. Cash received from client"
                      className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] focus:outline-none focus:border-brand-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={l.debit}
                      onChange={(e) => updateLine(i, { debit: e.target.value, credit: e.target.value ? '' : l.credit })}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] font-mono text-right focus:outline-none focus:border-brand-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={l.credit}
                      onChange={(e) => updateLine(i, { credit: e.target.value, debit: e.target.value ? '' : l.debit })}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="w-full h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] font-mono text-right focus:outline-none focus:border-brand-500"
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    {lines.length > 2 && (
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
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-ink-100 bg-ink-50/40">
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, { ...empty }])}
              className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
            >
              + Add line
            </button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}
