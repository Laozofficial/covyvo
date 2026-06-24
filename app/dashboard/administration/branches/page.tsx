'use client'

import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { BranchIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { Branch, branchesApi } from '../../../../src/lib/hr-api'
import { BranchFormDrawer } from './_components/BranchFormDrawer'

export default function BranchesPage() {
  const [items, setItems] = useState<Branch[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await branchesApi.list({ limit: 100, includeInactive: true })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((b) =>
      b.name.toLowerCase().includes(q)
      || b.code.toLowerCase().includes(q)
      || (b.city ?? '').toLowerCase().includes(q),
    )
  }, [items, search])

  const counts = useMemo(() => {
    const head = items.filter((b) => b.isHeadOffice).length
    const active = items.filter((b) => b.isActive).length
    return { head, active, inactive: items.length - active }
  }, [items])

  function handleSaved(b: Branch) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === b.id)
      if (i >= 0) { const next = [...prev]; next[i] = b; return next }
      return [b, ...prev]
    })
  }

  async function handleDelete(b: Branch) {
    if (!confirm(`Deactivate "${b.name}"? Active references will be preserved.`)) return
    try {
      await branchesApi.remove(b.id)
      await load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate')
    }
  }

  return (
    <>
      <PageHeader
        title="Branches"
        description={`${total.toLocaleString()} locations · ${counts.head} head office · ${counts.active} active`}
        actions={
          <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
            New branch
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by name, code or city…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BranchIcon />}
          title={search ? 'No matches' : 'No branches yet'}
          description={search ? 'Try clearing the filter above.' : 'Add your head office and any regional locations.'}
          action={!search ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>Add first branch</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((b) => (
                <tr key={b.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">
                    <Link href={`/dashboard/administration/branches/${b.id}`} className="hover:text-brand-700">
                      {b.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/administration/branches/${b.id}`}
                      className="flex items-center gap-2 group"
                    >
                      <p className="font-semibold text-ink-900 group-hover:text-brand-700">{b.name}</p>
                      {b.isHeadOffice && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">HQ</span>
                      )}
                    </Link>
                    {b.address && <p className="text-[11px] text-ink-500 mt-0.5 truncate max-w-[360px]">{b.address}</p>}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600">
                    {[b.city, b.state, b.country].filter(Boolean).join(', ') || <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] font-mono text-ink-600">{b.phone ?? <span className="text-ink-400">—</span>}</td>
                  <td className="px-4 py-3">
                    {b.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-ink-100 text-ink-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => { setEditing(b); setDrawerOpen(true) }}
                      className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 mr-4"
                    >
                      Edit
                    </button>
                    {b.isActive && (
                      <button
                        onClick={() => handleDelete(b)}
                        className="text-[12px] font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BranchFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
