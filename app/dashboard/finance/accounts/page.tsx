'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { BookIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { Account, AccountType, accountTypeMeta, accountsApi } from '../../../../src/lib/finance-api'
import { AccountFormDrawer } from './_components/AccountFormDrawer'

const TYPE_FILTERS: { value: AccountType | ''; label: string }[] = [
  { value: '',          label: 'All types' },
  { value: 'asset',     label: 'Assets' },
  { value: 'liability', label: 'Liabilities' },
  { value: 'equity',    label: 'Equity' },
  { value: 'revenue',   label: 'Revenue' },
  { value: 'expense',   label: 'Expenses' },
]

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AccountType | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const r = await accountsApi.list({
        accountType: typeFilter || undefined,
        limit: 100,
      })
      setAccounts(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter])

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts
    const q = search.toLowerCase()
    return accounts.filter(
      (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    )
  }, [accounts, search])

  const totals = useMemo(() => {
    const by: Record<string, number> = {}
    for (const a of accounts) by[a.accountType] = (by[a.accountType] ?? 0) + 1
    return by
  }, [accounts])

  function handleSaved(a: Account) {
    setAccounts((prev) => {
      const idx = prev.findIndex((x) => x.id === a.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = a; return next
      }
      return [a, ...prev]
    })
  }

  return (
    <>
      <PageHeader
        title="Chart of Accounts"
        description={`${total.toLocaleString()} accounts · ${totals.asset ?? 0} assets · ${totals.liability ?? 0} liabilities · ${totals.expense ?? 0} expenses`}
        actions={
          <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
            New account
          </Button>
        }
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AccountType | '')}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          {TYPE_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookIcon />}
          title={search || typeFilter ? 'No matches' : 'No accounts yet'}
          description={search || typeFilter ? 'Try clearing filters above.' : 'Add your first GL account to start posting journals.'}
          action={!search && !typeFilter ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>New account</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Normal balance</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((a) => {
                const meta = accountTypeMeta(a.accountType)
                return (
                  <tr key={a.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{a.code}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{a.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600 uppercase font-semibold">{a.normalBalance}</td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600">
                      {a.parent ? <><span className="font-mono">{a.parent.code}</span> · {a.parent.name}</> : <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditing(a); setDrawerOpen(true) }}
                        className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AccountFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        parents={accounts}
        onSaved={handleSaved}
      />
    </>
  )
}
