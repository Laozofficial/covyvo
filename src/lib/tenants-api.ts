import { api } from './api'
import { AuthTenant } from './auth-api'

export type UpdateTenantPayload = Partial<{
  name: string
  taxId: string
  fiscalYearStartMonth: string
  fiscalYearEndMonth: string
  registeredAddress: string
  country: string
  state: string
  city: string
  baseCurrency: string
  category: string
}>

export const tenantsApi = {
  get: (id: string) => api<AuthTenant>(`/tenants/${id}`, { auth: true }),
  update: (id: string, body: UpdateTenantPayload) =>
    api<AuthTenant>(`/tenants/${id}`, { method: 'PATCH', body, auth: true }),
}
