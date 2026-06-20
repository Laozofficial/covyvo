const ACCESS_TOKEN_KEY = 'covyvo.access_token'
const SELECTION_TOKEN_KEY = 'covyvo.selection_token'
const SELECTION_TENANTS_KEY = 'covyvo.selection_tenants'
const SETUP_TOKEN_KEY = 'covyvo.setup_token'
const ACTIVE_USER_KEY = 'covyvo.active_user'
const ACTIVE_TENANT_KEY = 'covyvo.active_tenant'
const REGISTRATION_TOKEN_KEY = 'covyvo.registration_token'
const RESET_TOKEN_KEY = 'covyvo.reset_token'
const PENDING_EMAIL_KEY = 'covyvo.pending_email'

const isBrowser = () => typeof window !== 'undefined'

export const storage = {
  getAccessToken: () => (isBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null),
  setAccessToken: (token: string) => isBrowser() && localStorage.setItem(ACCESS_TOKEN_KEY, token),
  clearAccessToken: () => isBrowser() && localStorage.removeItem(ACCESS_TOKEN_KEY),

  getSelectionToken: () => (isBrowser() ? sessionStorage.getItem(SELECTION_TOKEN_KEY) : null),
  setSelectionToken: (token: string) =>
    isBrowser() && sessionStorage.setItem(SELECTION_TOKEN_KEY, token),
  clearSelectionToken: () => isBrowser() && sessionStorage.removeItem(SELECTION_TOKEN_KEY),

  getSelectionTenants: <T = unknown>(): T[] => {
    if (!isBrowser()) return []
    const raw = sessionStorage.getItem(SELECTION_TENANTS_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  },
  setSelectionTenants: (tenants: unknown[]) =>
    isBrowser() && sessionStorage.setItem(SELECTION_TENANTS_KEY, JSON.stringify(tenants)),
  clearSelectionTenants: () =>
    isBrowser() && sessionStorage.removeItem(SELECTION_TENANTS_KEY),

  getRegistrationToken: () =>
    isBrowser() ? sessionStorage.getItem(REGISTRATION_TOKEN_KEY) : null,
  setRegistrationToken: (token: string) =>
    isBrowser() && sessionStorage.setItem(REGISTRATION_TOKEN_KEY, token),
  clearRegistrationToken: () =>
    isBrowser() && sessionStorage.removeItem(REGISTRATION_TOKEN_KEY),

  getResetToken: () => (isBrowser() ? sessionStorage.getItem(RESET_TOKEN_KEY) : null),
  setResetToken: (token: string) =>
    isBrowser() && sessionStorage.setItem(RESET_TOKEN_KEY, token),
  clearResetToken: () => isBrowser() && sessionStorage.removeItem(RESET_TOKEN_KEY),

  getSetupToken: () => (isBrowser() ? sessionStorage.getItem(SETUP_TOKEN_KEY) : null),
  setSetupToken: (token: string) =>
    isBrowser() && sessionStorage.setItem(SETUP_TOKEN_KEY, token),
  clearSetupToken: () => isBrowser() && sessionStorage.removeItem(SETUP_TOKEN_KEY),

  getActiveUser: <T = unknown>(): T | null => {
    if (!isBrowser()) return null
    const raw = localStorage.getItem(ACTIVE_USER_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
  },
  setActiveUser: (user: unknown) =>
    isBrowser() && localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user)),
  clearActiveUser: () => isBrowser() && localStorage.removeItem(ACTIVE_USER_KEY),

  getActiveTenant: <T = unknown>(): T | null => {
    if (!isBrowser()) return null
    const raw = localStorage.getItem(ACTIVE_TENANT_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
  },
  setActiveTenant: (tenant: unknown) =>
    isBrowser() && localStorage.setItem(ACTIVE_TENANT_KEY, JSON.stringify(tenant)),
  clearActiveTenant: () => isBrowser() && localStorage.removeItem(ACTIVE_TENANT_KEY),

  getPendingEmail: () => (isBrowser() ? sessionStorage.getItem(PENDING_EMAIL_KEY) : null),
  setPendingEmail: (email: string) =>
    isBrowser() && sessionStorage.setItem(PENDING_EMAIL_KEY, email),
  clearPendingEmail: () => isBrowser() && sessionStorage.removeItem(PENDING_EMAIL_KEY),

  clearAll: () => {
    if (!isBrowser()) return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(ACTIVE_USER_KEY)
    localStorage.removeItem(ACTIVE_TENANT_KEY)
    sessionStorage.removeItem(SELECTION_TOKEN_KEY)
    sessionStorage.removeItem(SELECTION_TENANTS_KEY)
    sessionStorage.removeItem(REGISTRATION_TOKEN_KEY)
    sessionStorage.removeItem(RESET_TOKEN_KEY)
    sessionStorage.removeItem(SETUP_TOKEN_KEY)
    sessionStorage.removeItem(PENDING_EMAIL_KEY)
  },
}
