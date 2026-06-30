'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { BuildingIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import {
  Vendor,
  VendorCategory,
  vendorCategoryLabel,
  vendorsApi,
} from '../../../../src/lib/business-api'
import { VendorFormDrawer } from './_components/VendorFormDrawer'

const CATEGORY_FILTERS: { value: VendorCategory | ''; label: string }[] = [
  { value: '',                  label: 'All categories' },
  { value: 'supplier',          label: 'Suppliers' },
  { value: 'service_provider',  label: 'Service providers' },
  { value: 'contractor',        label: 'Contractors' },
  { value: 'landlord',          label: 'Landlords' },
  { value: 'utility',           label: 'Utilities' },
  { value: 'other',             label: 'Other' },
]

export default function VendorsPage() {
  const [items, setItems] = useState<Vendor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<VendorCategory | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await vendorsApi.list({
        search: search || undefined,
        category: category || undefined,
        includeInactive: true,
        limit: 100,
      })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category])

  const active = useMemo(() => items.filter((v) => v.isActive).length, [items])

  function handleSaved(v: Vendor) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === v.id)
      if (i >= 0) { const next = [...prev]; next[i] = v; return next }
      return [v, ...prev]
    })
  }

  async function handleDelete(v: Vendor) {
    if (!confirm(`Deactivate "${v.name}"?`)) return
    try {
      await vendorsApi.remove(v.id)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate')
    }
  }

  return (
    <>
      <PageHeader
        title="Vendors"
        description={`${total.toLocaleString()} total · ${active} active`}
        actions={
          <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>
            New vendor
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by name, code or email…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as VendorCategory | '')}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          {CATEGORY_FILTERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BuildingIcon />}
          title={search || category ? 'No matches' : 'No vendors yet'}
          description={search || category ? 'Try clearing filters above.' : 'Add the suppliers, contractors, landlords and utilities you pay.'}
          action={!search && !category ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>Add first vendor</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3 text-right">Terms</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((v) => (
                <tr key={v.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{v.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{v.name}</p>
                    {v.contactName && <p className="text-[11px] text-ink-500 mt-0.5">{v.contactName}</p>}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] font-semibold text-ink-700">{vendorCategoryLabel(v.category)}</td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600">
                    {v.bankName ? (
                      <>
                        <p className="font-medium text-ink-800">{v.bankName}</p>
                        {v.bankAccountNumber && <p className="font-mono text-[10.5px] text-ink-500">{v.bankAccountNumber}</p>}
                      </>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[11.5px] text-ink-700 font-mono">
                    {v.paymentTermsDays != null ? `${v.paymentTermsDays}d` : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {v.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-ink-100 text-ink-600">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(v); setDrawerOpen(true) }} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 mr-4">Edit</button>
                    {v.isActive && (
                      <button onClick={() => handleDelete(v)} className="text-[12px] font-semibold text-rose-600 hover:text-rose-700">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VendorFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
