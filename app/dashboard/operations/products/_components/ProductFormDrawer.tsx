'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Checkbox } from '../../../../../src/components/ui/Checkbox'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import { CoinIcon, PackageIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Product, ProductType, productsApi } from '../../../../../src/lib/procurement-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Product | null
  onSaved: (p: Product) => void
}

export function ProductFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ProductType>('stock')
  const [uom, setUom] = useState('each')
  const [category, setCategory] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [vatRate, setVatRate] = useState('0.075')
  const [trackInventory, setTrackInventory] = useState(true)
  const [reorderPoint, setReorderPoint] = useState('')
  const [reorderQuantity, setReorderQuantity] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSku(initial?.sku ?? '')
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setType(initial?.type ?? 'stock')
    setUom(initial?.unitOfMeasure ?? 'each')
    setCategory(initial?.category ?? '')
    setPurchasePrice(initial?.purchasePrice ? String(Number(initial.purchasePrice)) : '')
    setSalePrice(initial?.salePrice ? String(Number(initial.salePrice)) : '')
    setCurrency(initial?.currency ?? 'NGN')
    setVatRate(initial?.vatRate ? String(Number(initial.vatRate)) : '0.075')
    setTrackInventory(initial?.trackInventory ?? true)
    setReorderPoint(initial?.reorderPoint ? String(Number(initial.reorderPoint)) : '')
    setReorderQuantity(initial?.reorderQuantity ? String(Number(initial.reorderQuantity)) : '')
    setIsActive(initial?.isActive ?? true)
    setError(null)
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const body: Partial<Product> = {
        sku: sku.trim() || undefined,
        name: name.trim(),
        description: description.trim() || null,
        type,
        unitOfMeasure: uom.trim() || 'each',
        category: category.trim() || null,
        purchasePrice: purchasePrice === '' ? null : Number(purchasePrice) as unknown as string,
        salePrice: salePrice === '' ? null : Number(salePrice) as unknown as string,
        currency: currency.toUpperCase(),
        vatRate: (Number(vatRate) || 0) as unknown as string,
        trackInventory,
        reorderPoint: reorderPoint === '' ? null : Number(reorderPoint) as unknown as string,
        reorderQuantity: reorderQuantity === '' ? null : Number(reorderQuantity) as unknown as string,
      }
      const saved = editing
        ? await productsApi.update(initial!.id, { ...body, isActive })
        : await productsApi.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save product')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${initial!.sku}` : 'New product'}
      description="A product, service or non-stock item your business buys or sells."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="product-form" loading={busy} disabled={!name.trim()}>
            {editing ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="product-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="SKU" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} icon={<TagIcon />} hint="auto-generated if blank" disabled={editing} />
          <TextField label="Name *" value={name} onChange={(e) => setName(e.target.value)} icon={<PackageIcon />} hint="e.g. Office chair, ergonomic" />
        </div>
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} icon={<TagIcon />} hint="e.g. Mesh back, adjustable lumbar, 5-year warranty" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectField
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as ProductType)}
            options={[
              { value: 'stock', label: 'Stock item' },
              { value: 'service', label: 'Service' },
              { value: 'non_stock', label: 'Non-stock' },
            ]}
          />
          <TextField label="Unit of measure" value={uom} onChange={(e) => setUom(e.target.value)} icon={<TagIcon />} hint="e.g. each, kg, hour, m²" />
          <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} icon={<TagIcon />} hint="e.g. Office furniture" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <TextField label="Purchase price" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value.replace(/[^\d.]/g, ''))} icon={<CoinIcon />} hint="e.g. 45000.00" />
          <TextField label="Sale price" value={salePrice} onChange={(e) => setSalePrice(e.target.value.replace(/[^\d.]/g, ''))} icon={<CoinIcon />} hint="e.g. 65000.00" />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. NGN" />
          <TextField label="VAT rate" value={vatRate} onChange={(e) => setVatRate(e.target.value.replace(/[^\d.]/g, ''))} icon={<TagIcon />} hint="0.075 = 7.5%" />
        </div>
        <div className="pt-1">
          <Checkbox label="Track inventory for this product" checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} />
        </div>
        {trackInventory && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Reorder point" value={reorderPoint} onChange={(e) => setReorderPoint(e.target.value.replace(/[^\d.]/g, ''))} icon={<TagIcon />} hint="alert when stock drops below this" />
            <TextField label="Reorder quantity" value={reorderQuantity} onChange={(e) => setReorderQuantity(e.target.value.replace(/[^\d.]/g, ''))} icon={<TagIcon />} hint="suggested order qty when reordering" />
          </div>
        )}
        {editing && (
          <div className="pt-1">
            <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          </div>
        )}
      </form>
    </Drawer>
  )
}
