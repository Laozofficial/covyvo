import { api } from './api'

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

export type DocLineInput = {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  taxRate?: number
}

export type DocLine = {
  id: string
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
  lineSubtotal: string
  lineTax: string
  lineTotal: string
}

/* ── Quotations ──────────────────────────────────────────────────────── */

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted'

export type Quotation = {
  id: string
  reference: string
  customerId: string
  customer?: { id: string; name: string }
  quoteDate: string
  validUntil: string | null
  currency: string
  subtotal: string
  taxTotal: string
  total: string
  status: QuotationStatus
  convertedInvoiceId: string | null
  notes: string | null
  lines?: DocLine[]
  createdAt: string
}

export const quotationsApi = {
  list: (q: { search?: string; status?: QuotationStatus; branchId?: string; limit?: number } = {}) =>
    api<PagedList<Quotation>>(`/quotations${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<Quotation>(`/quotations/${id}`, { auth: true }),
  create: (body: {
    customerId: string
    quoteDate: string
    validUntil?: string
    currency?: string
    notes?: string
    lines: DocLineInput[]
  }) => api<Quotation>('/quotations', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<Quotation>(`/quotations/${id}`, { method: 'PATCH', body, auth: true }),
  convert: (id: string) =>
    api<{ quotationId: string; invoiceId: string; invoiceReference: string }>(
      `/quotations/${id}/convert`,
      { method: 'POST', auth: true },
    ),
  remove: (id: string) => api<{ message: string }>(`/quotations/${id}`, { method: 'DELETE', auth: true }),
}

/* ── Credit Notes ────────────────────────────────────────────────────── */

export type CreditNoteStatus = 'draft' | 'issued' | 'applied' | 'void'

export type CreditNote = {
  id: string
  reference: string
  customerId: string
  customer?: { id: string; name: string }
  invoiceId: string | null
  issueDate: string
  currency: string
  subtotal: string
  taxTotal: string
  total: string
  reason: string | null
  status: CreditNoteStatus
  notes: string | null
  lines?: DocLine[]
  createdAt: string
}

export const creditNotesApi = {
  list: (q: { search?: string; status?: CreditNoteStatus; limit?: number } = {}) =>
    api<PagedList<CreditNote>>(`/credit-notes${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<CreditNote>(`/credit-notes/${id}`, { auth: true }),
  create: (body: {
    customerId: string
    invoiceId?: string
    issueDate: string
    currency?: string
    reason?: string
    notes?: string
    lines: DocLineInput[]
  }) => api<CreditNote>('/credit-notes', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<CreditNote>(`/credit-notes/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) => api<{ message: string }>(`/credit-notes/${id}`, { method: 'DELETE', auth: true }),
}

export function docStatusMeta(status: string) {
  const map: Record<string, { chip: string }> = {
    draft: { chip: 'bg-ink-100 text-ink-700' },
    sent: { chip: 'bg-sky-50 text-sky-700' },
    issued: { chip: 'bg-sky-50 text-sky-700' },
    accepted: { chip: 'bg-emerald-50 text-emerald-700' },
    applied: { chip: 'bg-emerald-50 text-emerald-700' },
    converted: { chip: 'bg-violet-50 text-violet-700' },
    declined: { chip: 'bg-rose-50 text-rose-700' },
    expired: { chip: 'bg-amber-50 text-amber-700' },
    void: { chip: 'bg-rose-50 text-rose-700' },
  }
  return map[status] ?? { chip: 'bg-ink-100 text-ink-700' }
}
