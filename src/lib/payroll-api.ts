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

/* ── presentation helpers ──────────────────────────────────────────── */

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
