import { api } from './api'

/* ── Customers ─────────────────────────────────────────────────────── */

export type CustomerTaxStatus = 'registered' | 'unregistered' | 'exempt'

export type Customer = {
  id: string
  tenantId: string
  code: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  taxId: string | null
  taxStatus: CustomerTaxStatus | null
  paymentTermsDays: number | null
  creditLimit: string | null
  currency: string
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/* ── Vendors ───────────────────────────────────────────────────────── */

export type VendorCategory =
  | 'supplier'
  | 'service_provider'
  | 'contractor'
  | 'landlord'
  | 'utility'
  | 'other'

export type Vendor = {
  id: string
  tenantId: string
  code: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  category: VendorCategory
  taxId: string | null
  paymentTermsDays: number | null
  currency: string
  bankName: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/* ── Designations ──────────────────────────────────────────────────── */

export type DesignationLevel =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'manager'
  | 'director'
  | 'executive'

export type Designation = {
  id: string
  tenantId: string
  code: string
  name: string
  level: DesignationLevel | null
  description: string | null
  isActive: boolean
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

export const customersApi = {
  list: (q: { search?: string; includeInactive?: boolean; limit?: number } = {}) =>
    api<PagedList<Customer>>(`/customers${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<Customer>(`/customers/${id}`, { auth: true }),
  create: (body: Partial<Customer>) =>
    api<Customer>('/customers', { method: 'POST', body, auth: true }),
  update: (id: string, body: Partial<Customer>) =>
    api<Customer>(`/customers/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/customers/${id}`, { method: 'DELETE', auth: true }),
}

export const vendorsApi = {
  list: (q: { search?: string; category?: VendorCategory; includeInactive?: boolean; limit?: number } = {}) =>
    api<PagedList<Vendor>>(`/vendors${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
  get: (id: string) => api<Vendor>(`/vendors/${id}`, { auth: true }),
  create: (body: Partial<Vendor>) =>
    api<Vendor>('/vendors', { method: 'POST', body, auth: true }),
  update: (id: string, body: Partial<Vendor>) =>
    api<Vendor>(`/vendors/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/vendors/${id}`, { method: 'DELETE', auth: true }),
}

export const designationsApi = {
  list: (q: { search?: string; includeInactive?: boolean; limit?: number } = {}) =>
    api<PagedList<Designation>>(`/designations${qs({ ...q, limit: q.limit ?? 100 })}`, { auth: true }),
  get: (id: string) => api<Designation>(`/designations/${id}`, { auth: true }),
  create: (body: Partial<Designation>) =>
    api<Designation>('/designations', { method: 'POST', body, auth: true }),
  update: (id: string, body: Partial<Designation>) =>
    api<Designation>(`/designations/${id}`, { method: 'PATCH', body, auth: true }),
  remove: (id: string) =>
    api<{ message: string }>(`/designations/${id}`, { method: 'DELETE', auth: true }),
}

/* ── presentation helpers ─────────────────────────────────────────── */

export function vendorCategoryLabel(c: VendorCategory): string {
  return {
    supplier: 'Supplier',
    service_provider: 'Service provider',
    contractor: 'Contractor',
    landlord: 'Landlord',
    utility: 'Utility',
    other: 'Other',
  }[c]
}

export function designationLevelLabel(l: DesignationLevel): string {
  return {
    intern: 'Intern',
    junior: 'Junior',
    mid: 'Mid-level',
    senior: 'Senior',
    lead: 'Lead',
    manager: 'Manager',
    director: 'Director',
    executive: 'Executive',
  }[l]
}
