import { api } from './api'
import type { Customer } from './business-api'
import type { Product } from './procurement-api'

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'void'

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'card'
  | 'cheque'
  | 'wallet'
  | 'other'

export type InvoiceLine = {
  id: string
  invoiceId: string
  productId: string | null
  product?: Product | null
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
  lineSubtotal: string
  lineTax: string
  lineTotal: string
  position: number
}

export type InvoicePayment = {
  id: string
  invoiceId: string
  paymentDate: string
  amount: string
  method: PaymentMethod
  reference: string | null
  notes: string | null
  voidedAt: string | null
  createdAt: string
}

export type Invoice = {
  id: string
  tenantId: string
  reference: string
  customerId: string
  customer?: Customer
  branchId: string | null
  departmentId: string | null
  issueDate: string
  dueDate: string
  currency: string
  subtotal: string
  taxTotal: string
  total: string
  paidAmount: string
  status: InvoiceStatus
  paymentTermsDays: number | null
  notes: string | null
  sentAt: string | null
  paidAt: string | null
  voidedAt: string | null
  lines: InvoiceLine[]
  payments: InvoicePayment[]
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

export const invoicesApi = {
  list: (q: {
    search?: string
    status?: InvoiceStatus
    customerId?: string
    branchId?: string
    from?: string
    to?: string
    limit?: number
  } = {}) =>
    api<PagedList<Invoice>>(`/invoices${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<Invoice>(`/invoices/${id}`, { auth: true }),
  create: (body: {
    reference?: string
    customerId: string
    branchId?: string
    departmentId?: string
    issueDate: string
    dueDate?: string
    paymentTermsDays?: number
    currency?: string
    notes?: string
    lines: Array<{
      productId?: string | null
      description: string
      quantity: number
      unitPrice: number
      taxRate?: number
    }>
  }) => api<Invoice>('/invoices', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<Invoice>(`/invoices/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/invoices/${id}`, { method: 'DELETE', auth: true }),

  recordPayment: (
    id: string,
    body: {
      paymentDate: string
      amount: number
      method?: PaymentMethod
      reference?: string
      notes?: string
    },
  ) => api<Invoice>(`/invoices/${id}/payments`, { method: 'POST', body, auth: true }),

  voidPayment: (id: string, paymentId: string) =>
    api<Invoice>(`/invoices/${id}/payments/${paymentId}`, { method: 'DELETE', auth: true }),
}

/* ── presentation helpers ─────────────────────────────────────────── */

export function invoiceStatusMeta(s: InvoiceStatus) {
  const map: Record<InvoiceStatus, { label: string; chip: string; dot: string }> = {
    draft:          { label: 'Draft',          chip: 'bg-ink-100 text-ink-700',        dot: 'bg-ink-400' },
    sent:           { label: 'Sent',           chip: 'bg-sky-50 text-sky-700',          dot: 'bg-sky-500' },
    partially_paid: { label: 'Partially paid', chip: 'bg-amber-50 text-amber-700',      dot: 'bg-amber-500' },
    paid:           { label: 'Paid',           chip: 'bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
    overdue:        { label: 'Overdue',        chip: 'bg-rose-50 text-rose-700',        dot: 'bg-rose-500' },
    void:           { label: 'Void',           chip: 'bg-ink-100 text-ink-500',         dot: 'bg-ink-400' },
  }
  return map[s]
}

export function paymentMethodLabel(m: PaymentMethod): string {
  return {
    cash: 'Cash',
    bank_transfer: 'Bank transfer',
    card: 'Card',
    cheque: 'Cheque',
    wallet: 'Wallet',
    other: 'Other',
  }[m]
}
