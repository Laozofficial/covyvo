import { api } from './api'

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type NormalBalance = 'debit' | 'credit'

export type Account = {
  id: string
  tenantId: string
  code: string
  name: string
  accountType: AccountType
  normalBalance: NormalBalance
  parentId: string | null
  parent: Account | null
  currency: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type JournalStatus = 'draft' | 'approved' | 'posted' | 'void'

export type JournalLine = {
  id: string
  entryId: string
  accountId: string
  account?: Account
  description: string | null
  debit: string
  credit: string
  position: number
}

export type JournalEntry = {
  id: string
  tenantId: string
  reference: string
  entryDate: string
  memo: string
  currency: string
  totalDebit: string
  totalCredit: string
  status: JournalStatus
  postedAt: string | null
  createdBy: string | null
  lines: JournalLine[]
  createdAt: string
  updatedAt: string
}

type PagedList<T> = { data: T[]; total: number; limit: number; offset: number }

function qs(params: Record<string, unknown>) {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    search.set(k, String(v))
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}

export const accountsApi = {
  list: (q: { search?: string; accountType?: AccountType; includeInactive?: boolean; limit?: number } = {}) =>
    api<PagedList<Account>>(`/accounts${qs({ ...q, limit: q.limit ?? 100 })}`, { auth: true }),
  get: (id: string) => api<Account>(`/accounts/${id}`, { auth: true }),
  create: (body: Partial<Account>) => api<Account>('/accounts', { method: 'POST', body, auth: true }),
  update: (id: string, body: Partial<Account>) =>
    api<Account>(`/accounts/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/accounts/${id}`, { method: 'DELETE', auth: true }),
}

export const journalsApi = {
  list: (q: { search?: string; status?: JournalStatus; from?: string; to?: string; limit?: number } = {}) =>
    api<PagedList<JournalEntry>>(`/journals${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<JournalEntry>(`/journals/${id}`, { auth: true }),
  create: (body: {
    entryDate: string
    memo: string
    currency?: string
    reference?: string
    lines: { accountId: string; description?: string; debit: number; credit: number }[]
  }) => api<JournalEntry>('/journals', { method: 'POST', body, auth: true }),
  update: (
    id: string,
    body: Partial<{
      entryDate: string
      memo: string
      currency: string
      status: JournalStatus
      lines: { accountId: string; description?: string; debit: number; credit: number }[]
    }>,
  ) => api<JournalEntry>(`/journals/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/journals/${id}`, { method: 'DELETE', auth: true }),
}

export function accountTypeMeta(t: AccountType): { label: string; chip: string } {
  switch (t) {
    case 'asset':     return { label: 'Asset',     chip: 'bg-emerald-50 text-emerald-700' }
    case 'liability': return { label: 'Liability', chip: 'bg-rose-50 text-rose-700' }
    case 'equity':    return { label: 'Equity',    chip: 'bg-violet-50 text-violet-700' }
    case 'revenue':   return { label: 'Revenue',   chip: 'bg-sky-50 text-sky-700' }
    case 'expense':   return { label: 'Expense',   chip: 'bg-amber-50 text-amber-700' }
  }
}

export function journalStatusMeta(s: JournalStatus): { label: string; chip: string; dot: string } {
  switch (s) {
    case 'draft':    return { label: 'Draft',    chip: 'bg-ink-100 text-ink-700',         dot: 'bg-ink-400' }
    case 'approved': return { label: 'Approved', chip: 'bg-sky-50 text-sky-700',           dot: 'bg-sky-500' }
    case 'posted':   return { label: 'Posted',   chip: 'bg-emerald-50 text-emerald-700',   dot: 'bg-emerald-500' }
    case 'void':     return { label: 'Void',     chip: 'bg-rose-50 text-rose-700',         dot: 'bg-rose-500' }
  }
}

export function formatMoney(value: string | number | null | undefined, currency = 'NGN') {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}
