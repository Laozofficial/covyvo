'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import { CalendarIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import {
  TaxSchedule,
  TaxScheduleKind,
  taxSchedulesApi,
} from '../../../../../src/lib/payroll-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: TaxSchedule | null
  onSaved: (s: TaxSchedule) => void
}

type DraftBracket = { lowerBound: string; upperBound: string; rate: string; label: string }

const emptyBracket = (): DraftBracket => ({ lowerBound: '', upperBound: '', rate: '', label: '' })

export function TaxScheduleFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<TaxScheduleKind>('paye')
  const [country, setCountry] = useState('NG')
  const [currency, setCurrency] = useState('NGN')
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [brackets, setBrackets] = useState<DraftBracket[]>([emptyBracket()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCode(initial?.code ?? '')
    setName(initial?.name ?? '')
    setKind(initial?.kind ?? 'paye')
    setCountry(initial?.country ?? 'NG')
    setCurrency(initial?.currency ?? 'NGN')
    setEffectiveFrom(initial?.effectiveFrom ?? new Date().toISOString().slice(0, 10))
    setDescription(initial?.description ?? '')
    setBrackets(initial?.brackets.length
      ? initial.brackets.map((b) => ({
          lowerBound: String(Number(b.lowerBound)),
          upperBound: b.upperBound ? String(Number(b.upperBound)) : '',
          rate: String(Number(b.rate)),
          label: b.label ?? '',
        }))
      : [emptyBracket()])
    setError(null)
  }, [open, initial])

  function updateBracket(i: number, patch: Partial<DraftBracket>) {
    setBrackets((prev) => prev.map((b, idx) => idx === i ? { ...b, ...patch } : b))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        kind,
        country: country.trim().toUpperCase(),
        currency: currency.trim().toUpperCase(),
        effectiveFrom,
        description: description.trim() || undefined,
        brackets: brackets
          .filter((b) => b.lowerBound !== '' || b.rate !== '')
          .map((b) => ({
            lowerBound: Number(b.lowerBound) || 0,
            upperBound: b.upperBound === '' ? null : Number(b.upperBound),
            rate: Number(b.rate) || 0,
            label: b.label.trim() || undefined,
          })),
      }
      const saved = editing
        ? await taxSchedulesApi.update(initial!.id, payload as any)
        : await taxSchedulesApi.create(payload)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save schedule')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      defaultSize="expanded"
      title={editing ? `Edit ${initial!.code}` : 'New tax schedule'}
      description="Statutory deduction table (PAYE, pension, NHF…)."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="tax-form" loading={busy} disabled={!code.trim() || !name.trim()}>
            {editing ? 'Save changes' : 'Create schedule'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="tax-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} icon={<TagIcon />} disabled={editing} hint="e.g. NG-PAYE-2024" />
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} icon={<TagIcon />} hint="e.g. Nigeria PAYE 2024" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SelectField
            label="Kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as TaxScheduleKind)}
            disabled={editing}
            options={[
              { value: 'paye', label: 'PAYE' },
              { value: 'pension', label: 'Pension' },
              { value: 'nhf', label: 'NHF' },
              { value: 'wht', label: 'WHT' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <TextField label="Country" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. NG" />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. NGN" />
          <TextField label="Effective from" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} icon={<CalendarIcon />} />
        </div>
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} icon={<TagIcon />} hint="e.g. Personal Income Tax Act progressive brackets" />

        <div className="rounded-xl border border-ink-200 overflow-hidden">
          <div className="px-3 py-2 bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">Brackets</div>
          <table className="w-full text-[12px]">
            <thead className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr><th className="px-2 py-1 text-right">Lower</th><th className="px-2 py-1 text-right">Upper</th><th className="px-2 py-1 text-right">Rate</th><th className="px-2 py-1 text-left">Label</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {brackets.map((b, i) => (
                <tr key={i}>
                  <td className="px-2 py-1"><input value={b.lowerBound} onChange={(e) => updateBracket(i, { lowerBound: e.target.value })} placeholder="0" inputMode="decimal" className="w-full h-8 rounded border border-ink-200 px-2 text-[12px] font-mono text-right" /></td>
                  <td className="px-2 py-1"><input value={b.upperBound} onChange={(e) => updateBracket(i, { upperBound: e.target.value })} placeholder="∞ if blank" inputMode="decimal" className="w-full h-8 rounded border border-ink-200 px-2 text-[12px] font-mono text-right" /></td>
                  <td className="px-2 py-1"><input value={b.rate} onChange={(e) => updateBracket(i, { rate: e.target.value })} placeholder="0.07" inputMode="decimal" className="w-full h-8 rounded border border-ink-200 px-2 text-[12px] font-mono text-right" /></td>
                  <td className="px-2 py-1"><input value={b.label} onChange={(e) => updateBracket(i, { label: e.target.value })} placeholder="First N300,000" className="w-full h-8 rounded border border-ink-200 px-2 text-[12px]" /></td>
                  <td className="px-2 py-1 text-right">
                    {brackets.length > 1 && (
                      <button type="button" onClick={() => setBrackets((prev) => prev.filter((_, idx) => idx !== i))} className="text-[11px] text-ink-500 hover:text-rose-600">×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-ink-100 bg-ink-50/40">
            <button type="button" onClick={() => setBrackets((prev) => [...prev, emptyBracket()])} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">+ Add bracket</button>
          </div>
        </div>
        <p className="text-[11px] text-ink-500">Rate is a decimal — <span className="font-mono">0.07</span> = 7%.</p>
      </form>
    </Drawer>
  )
}
