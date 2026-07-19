import { api } from './api'

export type ComponentKind = 'earning' | 'deduction'
export type CalculationType = 'fixed' | 'percent_of_basic' | 'percent_of_gross' | 'formula'

export type SalaryComponent = {
  id: string
  structureId: string
  code: string
  name: string
  kind: ComponentKind
  calculationType: CalculationType
  amount: string | null
  rate: string | null
  formula: string | null
  isTaxable: boolean
  position: number
}

export type SalaryStructure = {
  id: string
  tenantId: string
  code: string
  name: string
  description: string | null
  currency: string
  isDefault: boolean
  isActive: boolean
  components: SalaryComponent[]
  createdAt: string
  updatedAt: string
}

export type TaxScheduleKind = 'paye' | 'pension' | 'nhf' | 'wht' | 'other'

export type TaxBracket = {
  id: string
  scheduleId: string
  position: number
  lowerBound: string
  upperBound: string | null
  rate: string
  flatAmount: string | null
  label: string | null
}

export type TaxSchedule = {
  id: string
  tenantId: string
  code: string
  name: string
  kind: TaxScheduleKind
  country: string
  currency: string
  effectiveFrom: string
  effectiveTo: string | null
  description: string | null
  isActive: boolean
  brackets: TaxBracket[]
  createdAt: string
  updatedAt: string
}

export type BankFileFormat = 'nibss_nip' | 'gtb_csv' | 'zenith_csv' | 'uba_csv' | 'generic_csv'
export type BankFileStatus = 'draft' | 'generated' | 'sent' | 'reconciled' | 'failed'

export type BankFile = {
  id: string
  tenantId: string
  reference: string
  name: string
  format: BankFileFormat
  periodStart: string
  periodEnd: string
  paymentDate: string | null
  currency: string
  employeeCount: number
  totalAmount: string
  sourceAccount: string | null
  sourceBank: string | null
  status: BankFileStatus
  generatedAt: string | null
  sentAt: string | null
  content: string | null
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

export const salaryStructuresApi = {
  list: (q: { search?: string; includeInactive?: boolean; limit?: number } = {}) =>
    api<PagedList<SalaryStructure>>(`/salary-structures${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<SalaryStructure>(`/salary-structures/${id}`, { auth: true }),
  create: (body: {
    code: string
    name: string
    description?: string
    currency?: string
    isDefault?: boolean
    components: Array<{
      code: string
      name: string
      kind: ComponentKind
      calculationType: CalculationType
      amount?: number
      rate?: number
      formula?: string
      isTaxable?: boolean
    }>
  }) => api<SalaryStructure>('/salary-structures', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<SalaryStructure>(`/salary-structures/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) => api<{ message: string }>(`/salary-structures/${id}`, { method: 'DELETE', auth: true }),
}

export const taxSchedulesApi = {
  list: (q: { search?: string; kind?: TaxScheduleKind; includeInactive?: boolean; limit?: number } = {}) =>
    api<PagedList<TaxSchedule>>(`/tax-schedules${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<TaxSchedule>(`/tax-schedules/${id}`, { auth: true }),
  create: (body: {
    code: string
    name: string
    kind: TaxScheduleKind
    country?: string
    currency?: string
    effectiveFrom: string
    effectiveTo?: string
    description?: string
    brackets: Array<{ lowerBound: number; upperBound?: number | null; rate?: number; flatAmount?: number | null; label?: string }>
  }) => api<TaxSchedule>('/tax-schedules', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<TaxSchedule>(`/tax-schedules/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) => api<{ message: string }>(`/tax-schedules/${id}`, { method: 'DELETE', auth: true }),
}

export const bankFilesApi = {
  list: (q: { search?: string; status?: BankFileStatus; format?: BankFileFormat; limit?: number } = {}) =>
    api<PagedList<BankFile>>(`/bank-files${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<BankFile>(`/bank-files/${id}`, { auth: true }),
  create: (body: {
    name: string
    format?: BankFileFormat
    periodStart: string
    periodEnd: string
    paymentDate?: string
    currency?: string
    employeeCount?: number
    totalAmount?: number
    sourceAccount?: string
    sourceBank?: string
  }) => api<BankFile>('/bank-files', { method: 'POST', body, auth: true }),
  update: (id: string, body: Partial<{ name: string; status: BankFileStatus; paymentDate: string | null }>) =>
    api<BankFile>(`/bank-files/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) => api<{ message: string }>(`/bank-files/${id}`, { method: 'DELETE', auth: true }),
}

/* ── Payroll runs, setup, schedule, wallet ─────────────────────────── */

export type PayrollRunStatus =
  | 'draft'
  | 'computed'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'void'

export type PayslipStatus = 'pending' | 'computed' | 'paid' | 'void'

export type PayslipItem = {
  id: string
  code: string
  name: string
  kind: ComponentKind
  calculationType: string
  amount: string
  rate: string | null
  baseAmount: string | null
  isTaxable: boolean
  position: number
}

export type Payslip = {
  id: string
  runId: string
  employeeId: string
  employee?: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    jobTitle: string | null
    bankName: string | null
    bankAccountNumber: string | null
  }
  salaryStructureId: string | null
  salaryStructure?: SalaryStructure | null
  currency: string
  basicSalary: string
  totalEarnings: string
  totalDeductions: string
  taxableEarnings: string
  netPay: string
  status: PayslipStatus
  paidAt: string | null
  items?: PayslipItem[]
  run?: PayrollRun
}

export type PayrollPayment = {
  id: string
  paymentDate: string
  amount: string
  method: string
  reference: string | null
  voidedAt: string | null
  createdAt: string
}

export type PayrollRun = {
  id: string
  reference: string
  name: string
  periodStart: string
  periodEnd: string
  payDate: string | null
  currency: string
  status: PayrollRunStatus
  employeeCount: number
  totalEarnings: string
  totalDeductions: string
  totalNet: string
  notes: string | null
  payslips?: Payslip[]
  payments?: PayrollPayment[]
  createdAt: string
}

export type PayrollCadence = 'monthly' | 'semimonthly' | 'biweekly' | 'weekly'

export type PayrollSchedule = {
  id: string
  tenantId: string
  enabled: boolean
  cadence: PayrollCadence
  payDay: number
  autoRun: boolean
  autoApprove: boolean
  reminderLeadDays: number
  defaultStructureId: string | null
  currency: string
  lastRunDate: string | null
  nextRunDate: string | null
  nextPayDate: string | null
}

export type SetupEmployeeRow = {
  id: string
  employeeCode: string
  name: string
  jobTitle: string | null
  department: string | null
  baseSalary: string | null
  currency: string
  salaryStructureId: string | null
  salaryStructureName: string | null
  usingDefault: boolean
  grossEarnings: string
  totalDeductions: string
  netPay: string
}

export type SetupOverview = {
  employees: SetupEmployeeRow[]
  structures: Array<{ id: string; name: string; isDefault: boolean }>
  defaultStructureId: string | null
  totals: { employeeCount: number; projectedNet: string }
}

export type AdjustmentKind = 'bonus' | 'penalty'

export type PayrollAdjustment = {
  id: string
  runId: string | null
  employeeId: string
  kind: AdjustmentKind
  label: string
  amount: string
  isTaxable: boolean
  recurring: boolean
  notes: string | null
  createdAt: string
}

export type Wallet = {
  id: string
  tenantId: string
  currency: string
  balance: string
  status: string
}

export type WalletTransaction = {
  id: string
  direction: 'credit' | 'debit'
  amount: string
  balanceAfter: string
  source: string
  status: string
  provider: string | null
  reference: string | null
  payrollRunId: string | null
  notes: string | null
  createdAt: string
}

export const payrollRunsApi = {
  list: (q: { search?: string; status?: PayrollRunStatus; limit?: number } = {}) =>
    api<PagedList<PayrollRun>>(`/payroll-runs${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<PayrollRun>(`/payroll-runs/${id}`, { auth: true }),
  create: (body: {
    name: string
    periodStart: string
    periodEnd: string
    payDate?: string
    currency?: string
    notes?: string
    employeeIds?: string[]
  }) => api<PayrollRun>('/payroll-runs', { method: 'POST', body, auth: true }),
  update: (id: string, body: Record<string, unknown>) =>
    api<PayrollRun>(`/payroll-runs/${id}`, { method: 'PATCH', body, auth: true }),
  compute: (id: string) => api<PayrollRun>(`/payroll-runs/${id}/compute`, { method: 'POST', auth: true }),
  approve: (id: string) => api<PayrollRun>(`/payroll-runs/${id}/approve`, { method: 'POST', auth: true }),
  recordPayment: (
    id: string,
    body: { paymentDate: string; amount: number; method?: string; reference?: string; notes?: string; coversAll?: boolean; payslipIds?: string[] },
  ) => api<PayrollRun>(`/payroll-runs/${id}/payments`, { method: 'POST', body, auth: true }),
  remove: (id: string) => api<{ message: string }>(`/payroll-runs/${id}`, { method: 'DELETE', auth: true }),
  payslip: (runId: string, payslipId: string) =>
    api<Payslip>(`/payroll-runs/${runId}/payslips/${payslipId}`, { auth: true }),
  updatePayslip: (
    runId: string,
    payslipId: string,
    body: {
      basicSalary?: number
      items: Array<{ code?: string; name: string; kind: ComponentKind; amount: number; isTaxable?: boolean }>
    },
  ) =>
    api<PayrollRun>(`/payroll-runs/${runId}/payslips/${payslipId}`, {
      method: 'PATCH',
      body,
      auth: true,
    }),
}

export const payrollSetupApi = {
  overview: () => api<SetupOverview>('/payroll-setup/overview', { auth: true }),
  assignStructure: (body: { employeeIds: string[]; structureId?: string | null }) =>
    api<{ updated: number }>('/payroll-setup/assign-structure', { method: 'POST', body, auth: true }),
}

export const payrollAdjustmentsApi = {
  list: (q: { runId?: string; employeeId?: string } = {}) =>
    api<PayrollAdjustment[]>(`/payroll-adjustments${qs(q)}`, { auth: true }),
  create: (body: {
    employeeId: string
    runId?: string
    kind: AdjustmentKind
    label: string
    amount: number
    isTaxable?: boolean
    recurring?: boolean
    notes?: string
  }) => api<PayrollAdjustment>('/payroll-adjustments', { method: 'POST', body, auth: true }),
  remove: (id: string) => api<{ message: string }>(`/payroll-adjustments/${id}`, { method: 'DELETE', auth: true }),
}

export const payrollScheduleApi = {
  get: () => api<PayrollSchedule>('/payroll-schedule', { auth: true }),
  upsert: (body: Partial<Omit<PayrollSchedule, 'id' | 'tenantId'>>) =>
    api<PayrollSchedule>('/payroll-schedule', { method: 'PUT', body, auth: true }),
  runNow: (body: { approve?: boolean } = {}) =>
    api<PayrollRun>('/payroll-schedule/run-now', { method: 'POST', body, auth: true }),
}

export const walletApi = {
  get: () => api<Wallet>('/wallet', { auth: true }),
  transactions: (q: { limit?: number } = {}) =>
    api<PagedList<WalletTransaction>>(`/wallet/transactions${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  fund: (body: { amount: number; email?: string; notes?: string }) =>
    api<{ settled: boolean; authorizationUrl?: string | null; wallet?: Wallet; transaction: WalletTransaction }>(
      '/wallet/fund',
      { method: 'POST', body, auth: true },
    ),
}

/* ── presentation helpers ──────────────────────────────────────────── */

export function payrollRunStatusMeta(s: PayrollRunStatus) {
  const map: Record<PayrollRunStatus, { label: string; chip: string; dot: string }> = {
    draft:          { label: 'Draft',          chip: 'bg-ink-100 text-ink-700',       dot: 'bg-ink-400' },
    computed:       { label: 'Computed',       chip: 'bg-sky-50 text-sky-700',         dot: 'bg-sky-500' },
    approved:       { label: 'Approved',       chip: 'bg-violet-50 text-violet-700',   dot: 'bg-violet-500' },
    partially_paid: { label: 'Partially paid', chip: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-500' },
    paid:           { label: 'Paid',           chip: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    void:           { label: 'Void',           chip: 'bg-rose-50 text-rose-700',       dot: 'bg-rose-500' },
  }
  return map[s]
}

export const payrollCadenceLabel: Record<PayrollCadence, string> = {
  monthly: 'Monthly',
  semimonthly: 'Twice a month',
  biweekly: 'Every 2 weeks',
  weekly: 'Weekly',
}



export function componentKindMeta(k: ComponentKind) {
  return k === 'earning'
    ? { label: 'Earning', chip: 'bg-emerald-50 text-emerald-700' }
    : { label: 'Deduction', chip: 'bg-rose-50 text-rose-700' }
}

export function calculationTypeLabel(c: CalculationType): string {
  return {
    fixed: 'Fixed amount',
    percent_of_basic: '% of basic',
    percent_of_gross: '% of gross',
    formula: 'Formula',
  }[c]
}

export function taxKindMeta(k: TaxScheduleKind) {
  const map: Record<TaxScheduleKind, { label: string; chip: string }> = {
    paye:    { label: 'PAYE',    chip: 'bg-sky-50 text-sky-700' },
    pension: { label: 'Pension', chip: 'bg-violet-50 text-violet-700' },
    nhf:     { label: 'NHF',     chip: 'bg-amber-50 text-amber-700' },
    wht:     { label: 'WHT',     chip: 'bg-emerald-50 text-emerald-700' },
    other:   { label: 'Other',   chip: 'bg-ink-100 text-ink-700' },
  }
  return map[k]
}

export function bankFileFormatLabel(f: BankFileFormat) {
  return {
    nibss_nip:   'NIBSS NIP',
    gtb_csv:     'GTBank CSV',
    zenith_csv:  'Zenith CSV',
    uba_csv:     'UBA CSV',
    generic_csv: 'Generic CSV',
  }[f]
}

export function bankFileStatusMeta(s: BankFileStatus) {
  const map: Record<BankFileStatus, { label: string; chip: string; dot: string }> = {
    draft:      { label: 'Draft',      chip: 'bg-ink-100 text-ink-700',           dot: 'bg-ink-400' },
    generated:  { label: 'Generated',  chip: 'bg-sky-50 text-sky-700',             dot: 'bg-sky-500' },
    sent:       { label: 'Sent',       chip: 'bg-emerald-50 text-emerald-700',     dot: 'bg-emerald-500' },
    reconciled: { label: 'Reconciled', chip: 'bg-violet-50 text-violet-700',       dot: 'bg-violet-500' },
    failed:     { label: 'Failed',     chip: 'bg-rose-50 text-rose-700',           dot: 'bg-rose-500' },
  }
  return map[s]
}
