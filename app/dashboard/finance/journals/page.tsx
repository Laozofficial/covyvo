'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { FileTextIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import {
  Account,
  JournalEntry,
  JournalStatus,
  accountsApi,
  formatMoney,
  journalStatusMeta,
  journalsApi,
} from '../../../../src/lib/finance-api'
import { JournalFormDrawer } from './_components/JournalFormDrawer'

const STATUS_FILTERS: { value: JournalStatus | ''; label: string }[] = [
  { value: '',         label: 'All' },
  { value: 'draft',    label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'posted',   label: 'Posted' },
  { value: 'void',     label: 'Void' },
]

export default function JournalsPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<JournalStatus | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await journalsApi.list({ status: status || undefined, limit: 50 })
      setEntries(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load journals')
    } finally {
      setLoading(false)
    }
  }

  async function loadAccounts() {
    try {
      const r = await accountsApi.list({ limit: 100 })
      setAccounts(r.data ?? [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadAccounts() }, [])
  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(
      (e) => e.reference.toLowerCase().includes(q) || e.memo.toLowerCase().includes(q),
    )
  }, [entries, search])

  const totals = useMemo(() => {
    const by: Record<string, number> = {}
    for (const e of entries) by[e.status] = (by[e.status] ?? 0) + 1
    return by
  }, [entries])

  function handleSaved(e: JournalEntry) {
    setEntries((prev) => {
      const i = prev.findIndex((x) => x.id === e.id)
      if (i >= 0) { const next = [...prev]; next[i] = e; return next }
      return [e, ...prev]
    })
  }

  async function transition(e: JournalEntry, next: JournalStatus) {
    try {
      const saved = await journalsApi.update(e.id, { status: next })
      handleSaved(saved)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not change status')
    }
  }

  return (
    <>
      <PageHeader
        title="Journal entries"
        description={`${total.toLocaleString()} entries · ${totals.draft ?? 0} drafts · ${totals.posted ?? 0} posted`}
        actions={
          <Button onClick={() => { setEditing(null); setDrawerOpen(true) }} disabled={accounts.length < 2}>
            New entry
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      {accounts.length < 2 && !loading && (
        <div className="mb-4"><Alert variant="info">Create at least two chart-of-accounts entries before posting journals.</Alert></div>
      )}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by reference or memo…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as JournalStatus | '')}
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
          icon={<FileTextIcon />}
          title={search || status ? 'No matches' : 'No journals yet'}
          description={
            search || status
              ? 'Try clearing filters above.'
              : accounts.length < 2
                ? 'Add at least two chart-of-accounts entries first, then record your first transaction.'
                : 'Record your first transaction — debits on one side, credits on the other.'
          }
          action={
            !search && !status && accounts.length >= 2 ? (
              <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
                New entry
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Memo</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((e) => {
                const meta = journalStatusMeta(e.status)
                return (
                  <tr key={e.id} className="text-[12.5px] align-top">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{e.reference}</td>
                    <td className="px-4 py-3 text-ink-700">{e.entryDate}</td>
                    <td className="px-4 py-3 text-ink-700 max-w-[300px] truncate">{e.memo}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(e.totalDebit, e.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(e.totalCredit, e.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {e.status === 'draft' && (
                        <button onClick={() => transition(e, 'approved')} className="text-[12px] font-semibold text-sky-600 hover:text-sky-700 mr-3">Approve</button>
                      )}
                      {e.status === 'approved' && (
                        <button onClick={() => transition(e, 'posted')} className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 mr-3">Post</button>
                      )}
                      <button
                        onClick={() => { setEditing(e); setDrawerOpen(true) }}
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

      <JournalFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        accounts={accounts}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
