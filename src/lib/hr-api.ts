import { api } from './api'

export type Department = {
  id: string
  tenantId: string
  code: string
  name: string
  description: string | null
  headEmployeeId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type Gender = 'male' | 'female' | 'other'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed'
export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'intern'
  | 'consultant'
export type EmploymentStatus =
  | 'active'
  | 'probation'
  | 'on_leave'
  | 'suspended'
  | 'terminated'
  | 'resigned'
export type PayFrequency = 'monthly' | 'bi_weekly' | 'weekly' | 'daily'

export type Employee = {
  id: string
  tenantId: string
  employeeCode: string

  firstName: string
  middleName: string | null
  lastName: string
  gender: Gender | null
  dateOfBirth: string | null
  maritalStatus: MaritalStatus | null
  nationality: string | null
  nin: string | null

  workEmail: string
  personalEmail: string | null
  phone: string | null
  address: string | null

  departmentId: string | null
  department: Department | null
  jobTitle: string | null
  employmentType: EmploymentType
  employmentStatus: EmploymentStatus
  hireDate: string | null
  terminationDate: string | null
  managerId: string | null

  baseSalary: string | null
  payFrequency: PayFrequency
  currency: string | null

  bankName: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null

  tin: string | null
  pensionPfa: string | null
  pensionRsaPin: string | null
  nhfNumber: string | null

  emergencyContactName: string | null
  emergencyContactRelationship: string | null
  emergencyContactPhone: string | null

  avatarUrl: string | null

  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type EmployeeListQuery = {
  search?: string
  departmentId?: string
  employmentStatus?: EmploymentStatus | ''
  employmentType?: EmploymentType | ''
  includeInactive?: boolean
  limit?: number
  offset?: number
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

export const departmentsApi = {
  list: (search?: string) =>
    api<PagedList<Department>>(
      `/departments${qs({ search, limit: 100 })}`,
      { auth: true },
    ),
  get: (id: string) => api<Department>(`/departments/${id}`, { auth: true }),
  create: (body: { name: string; code?: string; description?: string }) =>
    api<Department>('/departments', { method: 'POST', body, auth: true }),
  update: (
    id: string,
    body: Partial<{ name: string; code: string; description: string; isActive: boolean }>,
  ) => api<Department>(`/departments/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/departments/${id}`, { method: 'DELETE', auth: true }),
}

export const employeesApi = {
  list: (query: EmployeeListQuery = {}) =>
    api<PagedList<Employee>>(`/employees${qs(query as Record<string, unknown>)}`, {
      auth: true,
    }),
  get: (id: string) => api<Employee>(`/employees/${id}`, { auth: true }),
  create: (body: Partial<Employee>) =>
    api<Employee>('/employees', { method: 'POST', body, auth: true }),
  update: (id: string, body: Partial<Employee>) =>
    api<Employee>(`/employees/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/employees/${id}`, { method: 'DELETE', auth: true }),
}

/* ------- presentation helpers ------- */

export function fullName(e: Pick<Employee, 'firstName' | 'middleName' | 'lastName'>) {
  return [e.firstName, e.middleName, e.lastName].filter(Boolean).join(' ')
}

export function statusMeta(status: EmploymentStatus): {
  label: string
  chip: string
  dot: string
} {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        chip: 'bg-emerald-50 text-emerald-700',
        dot: 'bg-emerald-500',
      }
    case 'probation':
      return {
        label: 'Probation',
        chip: 'bg-sky-50 text-sky-700',
        dot: 'bg-sky-500',
      }
    case 'on_leave':
      return {
        label: 'On leave',
        chip: 'bg-violet-50 text-violet-700',
        dot: 'bg-violet-500',
      }
    case 'suspended':
      return {
        label: 'Suspended',
        chip: 'bg-amber-50 text-amber-700',
        dot: 'bg-amber-500',
      }
    case 'terminated':
      return {
        label: 'Terminated',
        chip: 'bg-red-50 text-red-700',
        dot: 'bg-red-500',
      }
    case 'resigned':
      return {
        label: 'Resigned',
        chip: 'bg-ink-100 text-ink-600',
        dot: 'bg-ink-400',
      }
  }
}

export function employmentTypeLabel(t: EmploymentType): string {
  return {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    intern: 'Intern',
    consultant: 'Consultant',
  }[t]
}

export function payFrequencyLabel(f: PayFrequency): string {
  return { monthly: 'Monthly', bi_weekly: 'Bi-weekly', weekly: 'Weekly', daily: 'Daily' }[f]
}
