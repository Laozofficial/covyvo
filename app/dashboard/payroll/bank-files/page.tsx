'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { DownloadIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import {
  BankFile,
  BankFileStatus,
  bankFileFormatLabel,
  bankFileStatusMeta,
  bankFilesApi,
} from '../../../../src/lib/payroll-api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { BankFileFormDrawer } from './_components/BankFileFormDrawer'

const STATUS_FILTERS: { value: BankFileStatus | ''; label: string }[] = [
  { value: '',           label: 'All' },
  { value: 'draft',      label: 'Draft' },
  { value: 'generated',  label: 'Generated' },
  { value: 'sent',       label: 'Sent' },
  { value: 'reconciled', label: 'Reconciled' },
  { value: 'failed',     label: 'Failed' },
]

export default function BankFilesPage() {
  const [items, setItems] = useState<BankFile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<BankFileStatus | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<BankFile | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await bankFilesApi.list({ status: status || undefined, limit: 50 })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bank files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((b) => b.reference.toLowerCase().includes(q) || b.name.toLowerCase().includes(q))
  }, [items, search])

  function handleSaved(b: BankFile) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === b.id)
      if (i >= 0) { const next = [...prev]; next[i] = b; return next }
      return [b, ...prev]
    })
  }

  async function transition(b: BankFile, next: BankFileStatus) {
    try {
      const saved = await bankFilesApi.update(b.id, { status: next })
      handleSaved(saved)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not change status')
    }
  }

  return (
    <>
      <PageHeader
        title="Bank files"
        description={`${total.toLocaleString()} salary disbursement batches`}
        actions={<Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>New bank file</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by reference or name…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BankFileStatus | '')}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<DownloadIcon />}
          title={search || status ? 'No matches' : 'No bank files yet'}
          description={search || status ? 'Try clearing filters above.' : 'Create a salary disbursement batch.'}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-right">Employees</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((b) => {
                const meta = bankFileStatusMeta(b.status)
                return (
                  <tr key={b.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{b.reference}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{b.name}</td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600 font-semibold">{bankFileFormatLabel(b.format)}</td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600">{b.periodStart} → {b.periodEnd}</td>
                    <td className="px-4 py-3 text-right font-mono">{b.employeeCount}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(b.totalAmount, b.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {b.status === 'draft' && (
                        <button onClick={() => transition(b, 'generated')} className="text-[12px] font-semibold text-sky-600 hover:text-sky-700 mr-3">Mark generated</button>
                      )}
                      {b.status === 'generated' && (
                        <button onClick={() => transition(b, 'sent')} className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 mr-3">Mark sent</button>
                      )}
                      <button onClick={() => { setEditing(b); setDrawerOpen(true) }} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <BankFileFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
