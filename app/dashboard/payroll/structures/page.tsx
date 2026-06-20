'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { CalculatorIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import {
  SalaryStructure,
  salaryStructuresApi,
} from '../../../../src/lib/payroll-api'
import { StructureFormDrawer } from './_components/StructureFormDrawer'

export default function SalaryStructuresPage() {
  const [items, setItems] = useState<SalaryStructure[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<SalaryStructure | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await salaryStructuresApi.list({ limit: 50 })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load structures')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
  }, [items, search])

  const counts = useMemo(() => {
    const totalComps = items.reduce((acc, s) => acc + (s.components?.length ?? 0), 0)
    const defaults = items.filter((s) => s.isDefault).length
    return { totalComps, defaults }
  }, [items])

  function handleSaved(s: SalaryStructure) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === s.id)
      if (i >= 0) { const next = [...prev]; next[i] = s; return next }
      return [s, ...prev]
    })
  }

  return (
    <>
      <PageHeader
        title="Salary structures"
        description={`${total.toLocaleString()} structures · ${counts.totalComps} components · ${counts.defaults} default`}
        actions={<Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>New structure</Button>}
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalculatorIcon />}
          title={search ? 'No matches' : 'No structures yet'}
          description={search ? 'Try clearing the filter above.' : 'Create your first salary structure — basic, housing, transport and statutory deductions.'}
          action={!search ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>Create structure</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3 text-right">Earnings</th>
                <th className="px-4 py-3 text-right">Deductions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((s) => {
                const earnings = s.components?.filter((c) => c.kind === 'earning').length ?? 0
                const deductions = s.components?.filter((c) => c.kind === 'deduction').length ?? 0
                return (
                  <tr key={s.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{s.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-900">{s.name}</p>
                      {s.description && (
                        <p className="text-[11px] text-ink-500 mt-0.5 truncate max-w-[420px]">{s.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] font-semibold text-ink-700">{s.currency}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink-700">{earnings}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink-700">{deductions}</td>
                    <td className="px-4 py-3">
                      {s.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                          Default
                        </span>
                      ) : !s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-ink-100 text-ink-600">
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditing(s); setDrawerOpen(true) }}
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

      <StructureFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
