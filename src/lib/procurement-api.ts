import { api } from './api'

/* ── Products ──────────────────────────────────────────────────────── */

export type ProductType = 'stock' | 'service' | 'non_stock'

export type Product = {
  id: string
  tenantId: string
  sku: string
  name: string
  description: string | null
  type: ProductType
  unitOfMeasure: string
  category: string | null
  purchasePrice: string | null
  salePrice: string | null
  currency: string
  vatRate: string
  trackInventory: boolean
  reorderPoint: string | null
  reorderQuantity: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/* ── Purchase Orders ──────────────────────────────────────────────── */

export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'partially_received'
  | 'received'
  | 'closed'
  | 'void'

export type PurchaseOrderLine = {
  id: string
  orderId: string
  productId: string | null
  product?: Product | null
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
  lineSubtotal: string
  lineTax: string
  lineTotal: string
  receivedQuantity: string
  position: number
}

export type PurchaseOrder = {
  id: string
  tenantId: string
  reference: string
  vendorId: string
  branchId: string | null
  orderDate: string
  expectedDate: string | null
  currency: string
  paymentTermsDays: number | null
  status: PurchaseOrderStatus
  subtotal: string
  taxTotal: string
  total: string
  notes: string | null
  sentAt: string | null
  receivedAt: string | null
  closedAt: string | null
  lines: PurchaseOrderLine[]
  createdAt: string
  updatedAt: string
}

/* ── Goods Receipts ──────────────────────────────────────────────── */

export type GoodsReceiptStatus = 'draft' | 'confirmed' | 'void'

export type GoodsReceiptLine = {
  id: string
  receiptId: string
  orderLineId: string
  orderLine?: PurchaseOrderLine
  productId: string | null
  product?: Product | null
  description: string
  quantityReceived: string
  notes: string | null
  position: number
}

export type GoodsReceipt = {
  id: string
  tenantId: string
  reference: string
  orderId: string
  order?: PurchaseOrder
  receiptDate: string
  branchId: string | null
  status: GoodsReceiptStatus
  notes: string | null
  confirmedAt: string | null
  receivedBy: string | null
  lines: GoodsReceiptLine[]
  createdAt: string
  updatedAt: string
}

type PagedList<T> = { data: T[]; total: number; limit: number; offset: number }

function qs(p: Record<string, unknown>) {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === '') continue
    s.set(k, String(v))
  }
  const str = s.toString()
  return str ? `?${str}` : ''
}

export const productsApi = {
  list: (q: { search?: string; type?: ProductType; includeInactive?: boolean; limit?: number } = {}) =>
    api<PagedList<Product>>(`/products${qs({ ...q, limit: q.limit ?? 100 })}`, { auth: true }),
  get: (id: string) => api<Product>(`/products/${id}`, { auth: true }),
  create: (body: Partial<Product>) =>
    api<Product>('/products', { method: 'POST', body, auth: true }),
  update: (id: string, body: Partial<Product>) =>
    api<Product>(`/products/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/products/${id}`, { method: 'DELETE', auth: true }),
}

export const purchaseOrdersApi = {
  list: (q: {
    search?: string
    vendorId?: string
    branchId?: string
    status?: PurchaseOrderStatus
    from?: string
    to?: string
    limit?: number
  } = {}) =>
    api<PagedList<PurchaseOrder>>(`/purchase-orders${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<PurchaseOrder>(`/purchase-orders/${id}`, { auth: true }),
  create: (body: {
    reference?: string
    vendorId: string
    branchId?: string
    orderDate: string
    expectedDate?: string
    currency?: string
    paymentTermsDays?: number
    notes?: string
    lines: Array<{
      productId?: string | null
      description: string
      quantity: number
      unitPrice: number
      taxRate?: number
    }>
  }) => api<PurchaseOrder>('/purchase-orders', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<PurchaseOrder>(`/purchase-orders/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/purchase-orders/${id}`, { method: 'DELETE', auth: true }),
}

export const goodsReceiptsApi = {
  list: (q: {
    search?: string
    orderId?: string
    status?: GoodsReceiptStatus
    from?: string
    to?: string
    branchId?: string
    limit?: number
  } = {}) =>
    api<PagedList<GoodsReceipt>>(`/goods-receipts${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<GoodsReceipt>(`/goods-receipts/${id}`, { auth: true }),
  create: (body: {
    reference?: string
    orderId: string
    receiptDate: string
    branchId?: string
    notes?: string
    lines: Array<{
      orderLineId: string
      quantityReceived: number
      description?: string
      notes?: string
    }>
  }) => api<GoodsReceipt>('/goods-receipts', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<GoodsReceipt>(`/goods-receipts/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/goods-receipts/${id}`, { method: 'DELETE', auth: true }),
}

/* ── presentation helpers ─────────────────────────────────────────── */

export function productTypeLabel(t: ProductType): string {
  return { stock: 'Stock item', service: 'Service', non_stock: 'Non-stock' }[t]
}

export function poStatusMeta(s: PurchaseOrderStatus) {
  const map: Record<PurchaseOrderStatus, { label: string; chip: string; dot: string }> = {
    draft:              { label: 'Draft',              chip: 'bg-ink-100 text-ink-700',     dot: 'bg-ink-400' },
    sent:               { label: 'Sent',               chip: 'bg-sky-50 text-sky-700',       dot: 'bg-sky-500' },
    partially_received: { label: 'Partially received', chip: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
    received:           { label: 'Received',           chip: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    closed:             { label: 'Closed',             chip: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
    void:               { label: 'Void',               chip: 'bg-rose-50 text-rose-700',     dot: 'bg-rose-500' },
  }
  return map[s]
}

export function grnStatusMeta(s: GoodsReceiptStatus) {
  const map: Record<GoodsReceiptStatus, { label: string; chip: string; dot: string }> = {
    draft:     { label: 'Draft',     chip: 'bg-ink-100 text-ink-700',           dot: 'bg-ink-400' },
    confirmed: { label: 'Confirmed', chip: 'bg-emerald-50 text-emerald-700',    dot: 'bg-emerald-500' },
    void:      { label: 'Void',      chip: 'bg-rose-50 text-rose-700',          dot: 'bg-rose-500' },
  }
  return map[s]
}
