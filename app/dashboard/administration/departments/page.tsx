'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { BuildingIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { Branch, Department, branchesApi, departmentsApi } from '../../../../src/lib/hr-api'
import { DepartmentFormDrawer } from './_components/DepartmentFormDrawer'

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await departmentsApi.list({
        branchId: branchFilter || undefined,
        includeInactive: true,
        limit: 100,
      })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  async function loadBranches() {
    try {
      const r = await branchesApi.list({ limit: 100 })
      setBranches(r.data ?? [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadBranches() }, [])
  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((d) =>
      d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q),
    )
  }, [items, search])

  const active = items.filter((d) => d.isActive).length

  function handleSaved(d: Department) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === d.id)
      if (i >= 0) { const next = [...prev]; next[i] = d; return next }
      return [d, ...prev]
    })
  }

  async function handleDelete(d: Department) {
    if (!confirm(`Deactivate "${d.name}"?`)) return
    try {
      await departmentsApi.remove(d.id)
      await load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate')
    }
  }

  return (
    <>
      <PageHeader
        title="Departments"
        description={`${total.toLocaleString()} departments · ${active} active`}
        actions={
          <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
            New department
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
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.code} · {b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BuildingIcon />}
          title={search || branchFilter ? 'No matches' : 'No departments yet'}
          description={search || branchFilter ? 'Try clearing filters above.' : 'Add departments to organise employees and reporting.'}
          action={!search && !branchFilter ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>Add first department</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((d) => (
                <tr key={d.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{d.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{d.name}</p>
                    {d.description && <p className="text-[11px] text-ink-500 mt-0.5 truncate max-w-[360px]">{d.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600">
                    {d.branch ? (
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <span className="font-mono">{d.branch.code}</span>
                        <span className="text-ink-500">·</span>
                        {d.branch.name}
                      </span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.isActive ? (
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
                      onClick={() => { setEditing(d); setDrawerOpen(true) }}
                      className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 mr-4"
                    >
                      Edit
                    </button>
                    {d.isActive && (
                      <button
                        onClick={() => handleDelete(d)}
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

      <DepartmentFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        branches={branches}
        onSaved={handleSaved}
      />
    </>
  )
}
