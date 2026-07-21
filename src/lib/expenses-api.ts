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

type EmployeeRef = { id: string; firstName: string; lastName: string; employeeCode: string }

/* ── Advances ────────────────────────────────────────────────────────── */

export type AdvanceStatus = 'requested' | 'approved' | 'disbursed' | 'retired' | 'cancelled'

export type AdvanceRetirement = {
  advanceAmount: string
  claimed: string
  balance: string
  owedByEmployee: string
  owedToEmployee: string
  claims: Array<{ id: string; reference: string; total: string; status: string }>
}

export type Advance = {
  id: string
  reference: string
  employeeId: string
  employee?: EmployeeRef
  requestDate: string
  amount: string
  currency: string
  purpose: string | null
  status: AdvanceStatus
  retiredAmount: string
  notes: string | null
  retirement?: AdvanceRetirement
  createdAt: string
}

export const advancesApi = {
  list: (q: { search?: string; status?: AdvanceStatus; employeeId?: string; limit?: number } = {}) =>
    api<PagedList<Advance>>(`/advances${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<Advance>(`/advances/${id}`, { auth: true }),
  create: (body: {
    employeeId: string
    requestDate: string
    amount: number
    currency?: string
    purpose?: string
    notes?: string
  }) => api<Advance>('/advances', { method: 'POST', body, auth: true }),
  update: (id: string, body: { status?: AdvanceStatus; amount?: number; purpose?: string; notes?: string }) =>
    api<Advance>(`/advances/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) => api<{ message: string }>(`/advances/${id}`, { method: 'DELETE', auth: true }),
}

/* ── Expense Claims ──────────────────────────────────────────────────── */

export type ExpenseClaimStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed'

export type ExpenseClaimLine = {
  id: string
  expenseDate: string
  category: string
  description: string
  amount: string
}

export type ExpenseClaim = {
  id: string
  reference: string
  employeeId: string
  employee?: EmployeeRef
  advanceId: string | null
  advance?: { id: string; reference: string } | null
  claimDate: string
  currency: string
  total: string
  status: ExpenseClaimStatus
  notes: string | null
  lines?: ExpenseClaimLine[]
  createdAt: string
}

export const expenseClaimsApi = {
  list: (q: { search?: string; status?: ExpenseClaimStatus; employeeId?: string; advanceId?: string; limit?: number } = {}) =>
    api<PagedList<ExpenseClaim>>(`/expense-claims${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<ExpenseClaim>(`/expense-claims/${id}`, { auth: true }),
  create: (body: {
    employeeId: string
    advanceId?: string
    claimDate: string
    currency?: string
    notes?: string
    lines: Array<{ expenseDate: string; category?: string; description: string; amount: number }>
  }) => api<ExpenseClaim>('/expense-claims', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<ExpenseClaim>(`/expense-claims/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) => api<{ message: string }>(`/expense-claims/${id}`, { method: 'DELETE', auth: true }),
}

export function expenseStatusMeta(status: string) {
  const map: Record<string, { chip: string }> = {
    draft: { chip: 'bg-ink-100 text-ink-700' },
    requested: { chip: 'bg-ink-100 text-ink-700' },
    submitted: { chip: 'bg-sky-50 text-sky-700' },
    approved: { chip: 'bg-emerald-50 text-emerald-700' },
    disbursed: { chip: 'bg-violet-50 text-violet-700' },
    reimbursed: { chip: 'bg-emerald-50 text-emerald-700' },
    retired: { chip: 'bg-violet-50 text-violet-700' },
    rejected: { chip: 'bg-rose-50 text-rose-700' },
    cancelled: { chip: 'bg-rose-50 text-rose-700' },
  }
  return map[status] ?? { chip: 'bg-ink-100 text-ink-700' }
}
