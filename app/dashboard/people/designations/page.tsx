'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { IdIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import {
  Designation,
  designationLevelLabel,
  designationsApi,
} from '../../../../src/lib/business-api'
import { DesignationFormDrawer } from './_components/DesignationFormDrawer'

export default function DesignationsPage() {
  const [items, setItems] = useState<Designation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Designation | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await designationsApi.list({ search: search || undefined, includeInactive: true, limit: 100 })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load designations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const active = useMemo(() => items.filter((d) => d.isActive).length, [items])

  function handleSaved(d: Designation) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === d.id)
      if (i >= 0) { const next = [...prev]; next[i] = d; return next }
      return [d, ...prev]
    })
  }

  async function handleDelete(d: Designation) {
    if (!confirm(`Deactivate "${d.name}"?`)) return
    try {
      await designationsApi.remove(d.id)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate')
    }
  }

  return (
    <>
      <PageHeader
        title="Designations"
        description={`${total.toLocaleString()} job titles · ${active} active`}
        actions={
          <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
            New designation
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by code or name…"
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
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IdIcon />}
          title={search ? 'No matches' : 'No designations yet'}
          description={search ? 'Try clearing the search above.' : 'Define job titles your employees can be assigned to.'}
          action={!search ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>Add first designation</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((d) => (
                <tr key={d.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{d.code}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{d.name}</td>
                  <td className="px-4 py-3 text-[11.5px] font-semibold text-ink-700">
                    {d.level ? designationLevelLabel(d.level) : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600 max-w-[400px] truncate">
                    {d.description ?? <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {d.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-ink-100 text-ink-600">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(d); setDrawerOpen(true) }} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 mr-4">Edit</button>
                    {d.isActive && (
                      <button onClick={() => handleDelete(d)} className="text-[12px] font-semibold text-rose-600 hover:text-rose-700">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DesignationFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
