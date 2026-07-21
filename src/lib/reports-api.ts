import { api } from './api'

function qs(p: Record<string, unknown>) {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === '') continue
    s.set(k, String(v))
  }
  const str = s.toString()
  return str ? `?${str}` : ''
}

export type AgeBuckets = {
  current: string
  d1_30: string
  d31_60: string
  d61_90: string
  d90_plus: string
}

export const BUCKET_LABELS: Record<keyof AgeBuckets, string> = {
  current: 'Current',
  d1_30: '1–30 days',
  d31_60: '31–60 days',
  d61_90: '61–90 days',
  d90_plus: '90+ days',
}

/* ── General Ledger ──────────────────────────────────────────────────── */

export type GlLine = {
  date: string
  reference: string
  description: string | null
  debit: string
  credit: string
  balance: string
}
export type GlAccount = {
  accountId: string
  code: string
  name: string
  accountType: string
  normalBalance: 'debit' | 'credit'
  openingBalance: string
  closingBalance: string
  lines: GlLine[]
}
export type GeneralLedger = { from: string | null; to: string | null; accounts: GlAccount[] }

/* ── Trial Balance ───────────────────────────────────────────────────── */

export type TrialBalanceRow = {
  accountId: string
  code: string
  name: string
  accountType: string
  debit: string
  credit: string
}
export type TrialBalance = {
  asOf: string
  rows: TrialBalanceRow[]
  totals: { debit: string; credit: string }
  balanced: boolean
}

/* ── AR / AP ─────────────────────────────────────────────────────────── */

export type ArRow = {
  id: string
  reference: string
  customer: string | null
  issueDate: string
  dueDate: string
  total: string
  paid: string
  outstanding: string
  bucket: keyof AgeBuckets
  currency: string
  status: string
}
export type AccountsReceivable = {
  asOf: string
  rows: ArRow[]
  buckets: AgeBuckets
  total: string
  count: number
}

export type ApRow = {
  id: string
  reference: string
  vendor: string | null
  orderDate: string
  expectedDate: string | null
  total: string
  outstanding: string
  bucket: keyof AgeBuckets
  currency: string
  status: string
}
export type AccountsPayable = {
  asOf: string
  rows: ApRow[]
  buckets: AgeBuckets
  total: string
  count: number
  note: string
}

/* ── Collections ─────────────────────────────────────────────────────── */

export type CollectionRow = {
  id: string
  paymentDate: string
  amount: string
  method: string
  reference: string | null
  invoiceReference: string
  customer: string | null
}
export type Collections = {
  from: string
  to: string
  rows: CollectionRow[]
  total: string
  count: number
  byMethod: Record<string, string>
}

/* ── Statutory Tax Center ────────────────────────────────────────────── */

export type TaxObligation = {
  code: string
  name: string
  category: 'payroll' | 'sales' | 'purchases'
  amount: string | null
  basis: string
  authority: string
  manual?: boolean
}

export type TaxSummary = {
  period: { month: string; start: string; end: string }
  payroll: {
    grossPayroll: string
    paye: string
    pensionEmployee: string
    pensionEmployer: string
    nhf: string
    nsitf: string
    itf: string
    runCount: number
  }
  vat: { outputVat: string; inputVat: string; netVat: string; invoiceCount: number }
  wht: { vendorSpend: string; poCount: number }
  obligations: TaxObligation[]
  totalPayable: string
}

export const taxCenterApi = {
  summary: (q: { month?: string } = {}) =>
    api<TaxSummary>(`/tax-center/summary${qs(q)}`, { auth: true }),
}

/* ── Bank Reconciliation ─────────────────────────────────────────────── */

export type BankAccount = { id: string; code: string; name: string; accountType: string }

export type RecWorkspaceLine = {
  id: string
  date: string
  reference: string
  description: string | null
  movement: string
  reconciled: boolean
}

export type RecWorkspace = {
  account: { id: string; code: string; name: string }
  bookBalance: string
  lines: RecWorkspaceLine[]
}

export type BankReconciliation = {
  id: string
  reference: string
  accountId: string
  account?: { id: string; code: string; name: string }
  statementDate: string
  statementBalance: string
  clearedBalance: string
  bookBalance: string
  difference: string
  status: 'draft' | 'completed'
  clearedLineIds: string[] | null
  notes: string | null
  createdAt: string
}

export const bankRecApi = {
  accounts: () => api<BankAccount[]>('/bank-reconciliations/accounts', { auth: true }),
  workspace: (accountId: string, statementDate?: string) =>
    api<RecWorkspace>(`/bank-reconciliations/workspace${qs({ accountId, statementDate })}`, { auth: true }),
  list: () => api<BankReconciliation[]>('/bank-reconciliations', { auth: true }),
  get: (id: string) => api<BankReconciliation>(`/bank-reconciliations/${id}`, { auth: true }),
  create: (body: {
    accountId: string
    statementDate: string
    statementBalance: number
    clearedLineIds: string[]
    notes?: string
    status?: 'draft' | 'completed'
  }) => api<BankReconciliation>('/bank-reconciliations', { method: 'POST', body, auth: true }),
}

export const reportsApi = {
  generalLedger: (q: { accountId?: string; from?: string; to?: string } = {}) =>
    api<GeneralLedger>(`/reports/general-ledger${qs(q)}`, { auth: true }),
  trialBalance: (q: { asOf?: string } = {}) =>
    api<TrialBalance>(`/reports/trial-balance${qs(q)}`, { auth: true }),
  accountsReceivable: (q: { asOf?: string } = {}) =>
    api<AccountsReceivable>(`/reports/accounts-receivable${qs(q)}`, { auth: true }),
  accountsPayable: (q: { asOf?: string } = {}) =>
    api<AccountsPayable>(`/reports/accounts-payable${qs(q)}`, { auth: true }),
  collections: (q: { from?: string; to?: string } = {}) =>
    api<Collections>(`/reports/collections${qs(q)}`, { auth: true }),
}
