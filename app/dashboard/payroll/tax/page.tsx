'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { FileTextIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import {
  TaxSchedule,
  TaxScheduleKind,
  taxKindMeta,
  taxSchedulesApi,
} from '../../../../src/lib/payroll-api'
import { TaxScheduleFormDrawer } from './_components/TaxScheduleFormDrawer'

const KIND_FILTERS: { value: TaxScheduleKind | ''; label: string }[] = [
  { value: '',        label: 'All kinds' },
  { value: 'paye',    label: 'PAYE' },
  { value: 'pension', label: 'Pension' },
  { value: 'nhf',     label: 'NHF' },
  { value: 'wht',     label: 'WHT' },
  { value: 'other',   label: 'Other' },
]

function formatN(v: string | null) {
  if (v === null || v === '') return '∞'
  return Number(v).toLocaleString('en-NG')
}

export default function TaxSchedulesPage() {
  const [items, setItems] = useState<TaxSchedule[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<TaxScheduleKind | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<TaxSchedule | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await taxSchedulesApi.list({ kind: kind || undefined, limit: 50 })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
  }, [items, search])

  function handleSaved(s: TaxSchedule) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === s.id)
      if (i >= 0) { const next = [...prev]; next[i] = s; return next }
      return [s, ...prev]
    })
  }

  return (
    <>
      <PageHeader
        title="Tax schedules"
        description={`${total.toLocaleString()} schedules · PAYE / pension / NHF`}
        actions={<Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>New schedule</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by code or name…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as TaxScheduleKind | '')}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          {KIND_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileTextIcon />}
          title={search || kind ? 'No matches' : 'No tax schedules yet'}
          description={search || kind ? 'Try clearing filters above.' : 'Set up PAYE, pension and NHF schedules to drive payroll.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const meta = taxKindMeta(s.kind)
            return (
              <div key={s.id} className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
                <div className="flex items-start justify-between gap-3 p-4 border-b border-ink-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink-900">{s.name}</p>
                      <span className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>{meta.label}</span>
                    </div>
                    <p className="text-[11.5px] font-mono text-ink-500 mt-0.5">{s.code} · {s.country} · {s.currency} · from {s.effectiveFrom}</p>
                    {s.description && <p className="text-[12px] text-ink-600 mt-1">{s.description}</p>}
                  </div>
                  <button onClick={() => { setEditing(s); setDrawerOpen(true) }} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">Edit</button>
                </div>
                <table className="w-full text-[12.5px]">
                  <thead className="bg-ink-50/40 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="px-4 py-2 text-right">Lower</th>
                      <th className="px-4 py-2 text-right">Upper</th>
                      <th className="px-4 py-2 text-right">Rate</th>
                      <th className="px-4 py-2 text-left">Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {s.brackets.map((b) => (
                      <tr key={b.id}>
                        <td className="px-4 py-2 text-right font-mono">{formatN(b.lowerBound)}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatN(b.upperBound)}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold">{(Number(b.rate) * 100).toFixed(2)}%</td>
                        <td className="px-4 py-2 text-ink-600">{b.label ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}

      <TaxScheduleFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
