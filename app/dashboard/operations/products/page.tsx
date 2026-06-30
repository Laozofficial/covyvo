'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { PackageIcon, SearchIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  Product,
  ProductType,
  productTypeLabel,
  productsApi,
} from '../../../../src/lib/procurement-api'
import { ProductFormDrawer } from './_components/ProductFormDrawer'

const TYPE_FILTERS: { value: ProductType | ''; label: string }[] = [
  { value: '',          label: 'All types' },
  { value: 'stock',     label: 'Stock items' },
  { value: 'service',   label: 'Services' },
  { value: 'non_stock', label: 'Non-stock' },
]

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProductType | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      const r = await productsApi.list({
        search: search || undefined,
        type: typeFilter || undefined,
        includeInactive: true,
        limit: 100,
      })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter])

  const active = useMemo(() => items.filter((p) => p.isActive).length, [items])

  function handleSaved(p: Product) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === p.id)
      if (i >= 0) { const next = [...prev]; next[i] = p; return next }
      return [p, ...prev]
    })
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Deactivate "${p.name}"?`)) return
    try {
      await productsApi.remove(p.id)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate')
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total.toLocaleString()} catalog items · ${active} active`}
        actions={<Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>New product</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ProductType | '')}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          {TYPE_FILTERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<PackageIcon />}
          title={search || typeFilter ? 'No matches' : 'No products yet'}
          description={search || typeFilter ? 'Try clearing filters above.' : 'Add the products and services your business buys and sells. They feed POs, invoices and inventory.'}
          action={!search && !typeFilter ? (
            <Button onClick={() => { setEditing(null); setDrawerOpen(true) }}>Add first product</Button>
          ) : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">UoM</th>
                <th className="px-4 py-3 text-right">Purchase</th>
                <th className="px-4 py-3 text-right">Sale</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((p) => (
                <tr key={p.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{p.sku}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{p.name}</p>
                    {p.category && <p className="text-[10.5px] text-ink-500 mt-0.5">{p.category}</p>}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] font-semibold text-ink-700">{productTypeLabel(p.type)}</td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600">{p.unitOfMeasure}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {p.purchasePrice ? formatMoney(p.purchasePrice, p.currency) : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {p.salePrice ? formatMoney(p.salePrice, p.currency) : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-ink-100 text-ink-600">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => { setEditing(p); setDrawerOpen(true) }} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 mr-4">Edit</button>
                    {p.isActive && (
                      <button onClick={() => handleDelete(p)} className="text-[12px] font-semibold text-rose-600 hover:text-rose-700">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </>
  )
}
