import { api } from './api'

export type StartRegistrationPayload = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export type VerifyOtpPayload = {
  email: string
  otp: string
}

export type CompleteRegistrationPayload = {
  registrationToken: string
  name: string
  taxId: string
  fiscalYearStartMonth: string
  fiscalYearEndMonth: string
  registeredAddress: string
  country?: string
  state?: string
  city?: string
  baseCurrency: string
  category: string
}

export type LoginPayload = {
  email: string
  password: string
  tenantId?: string
}

export type SelectTenantPayload = {
  selectionToken: string
  tenantId: string
}

export type StartPasswordResetPayload = { email: string }
export type CompletePasswordResetPayload = {
  resetToken: string
  password: string
  confirmPassword: string
}

export type TenantMembership = {
  id: string
  name: string
  slug?: string
  baseCurrency?: string
  category?: string
  baseUrl?: string
  role?: string
}

export type AuthUser = {
  id: string
  email: string
  fullName?: string
  tenantId?: string | null
  tenantSlug?: string
  role?: string
  permissions?: string[]
  emailVerifiedAt?: string | null
  isActive?: boolean
}

export type AuthTenant = {
  id: string
  name: string
  slug?: string
  taxId?: string
  fiscalYearStartMonth?: string
  fiscalYearEndMonth?: string
  registeredAddress?: string
  country?: string | null
  state?: string | null
  city?: string | null
  baseCurrency?: string
  category?: string
  baseUrl?: string
  plan?: string | null
  isActive?: boolean
}

export type AuthResult = {
  accessToken?: string
  registrationToken?: string
  resetToken?: string
  selectionToken?: string
  setupToken?: string
  requiresTenantSelection?: boolean
  passwordChangeRequired?: boolean
  permissions?: string[]
  tenants?: TenantMembership[]
  tenant?: AuthTenant
  membership?: { id: string; userId: string; tenantId: string; role: string }
  user?: AuthUser
  [k: string]: unknown
}

export const authApi = {
  startRegistration: (payload: StartRegistrationPayload) =>
    api<AuthResult>('/auth/registration/start', { method: 'POST', body: payload }),

  verifyRegistrationOtp: (payload: VerifyOtpPayload) =>
    api<AuthResult>('/auth/registration/verify-otp', { method: 'POST', body: payload }),

  completeRegistration: (payload: CompleteRegistrationPayload) =>
    api<AuthResult>('/auth/registration/complete', { method: 'POST', body: payload }),

  login: (payload: LoginPayload) =>
    api<AuthResult>('/auth/login', { method: 'POST', body: payload }),

  selectTenant: (payload: SelectTenantPayload) =>
    api<AuthResult>('/auth/select-tenant', { method: 'POST', body: payload }),

  completeInvite: (payload: {
    setupToken: string
    password: string
    confirmPassword: string
  }) => api<AuthResult>('/auth/complete-invite', { method: 'POST', body: payload }),

  startPasswordReset: (payload: StartPasswordResetPayload) =>
    api<AuthResult>('/auth/password-reset/start', { method: 'POST', body: payload }),

  verifyPasswordResetOtp: (payload: VerifyOtpPayload) =>
    api<AuthResult>('/auth/password-reset/verify-otp', { method: 'POST', body: payload }),

  completePasswordReset: (payload: CompletePasswordResetPayload) =>
    api<AuthResult>('/auth/password-reset/complete', { method: 'POST', body: payload }),

  me: () => api<AuthUser>('/auth/me', { auth: true }),
}
