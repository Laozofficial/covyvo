'use client'

import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { SearchIcon, ShieldCheckIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import {
  AuditLog,
  auditActionMeta,
  auditApi,
  timeAgo,
} from '../../../../src/lib/insights-api'

export default function AuditPage() {
  const [items, setItems] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const r = await auditApi.list({ limit: 100 })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load audit trail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (a) =>
        (a.summary ?? '').toLowerCase().includes(q) ||
        a.resource.toLowerCase().includes(q) ||
        (a.userName ?? a.userEmail ?? '').toLowerCase().includes(q),
    )
  }, [items, search])

  return (
    <>
      <PageHeader
        title="Audit Trail"
        description={`${total.toLocaleString()} recorded action${total === 1 ? '' : 's'} — every write, every actor.`}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by action, resource or user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          icon={<ShieldCheckIcon />}
          title={search ? 'No matches' : 'No audit events yet'}
          description={
            search
              ? 'Try a different search.'
              : 'As your team creates, edits and approves records, every action is captured here automatically.'
          }
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((a) => {
                const meta = auditActionMeta(a.action)
                return (
                  <tr key={a.id} className="text-[12.5px]">
                    <td className="px-4 py-3 text-[11.5px] text-ink-500 whitespace-nowrap" title={new Date(a.createdAt).toLocaleString()}>
                      {timeAgo(a.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${meta.chip}`}>
                        {a.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-900">{a.summary ?? a.resource}</div>
                      <div className="text-[11px] text-ink-500 font-mono">
                        {a.resource}
                        {a.resourceId ? ` · ${a.resourceId.slice(0, 8)}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600">{a.userName ?? a.userEmail ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-ink-500">{a.method}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
