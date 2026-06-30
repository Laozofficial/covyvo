import { storage } from './storage'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.covyvo.nexoristech.com/v1'

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

/**
 * Redirects to the sign-in screen and remembers where the user was so we
 * can bounce them back after they re-authenticate. Guarded so it only
 * runs in the browser; safe to call multiple times (the navigation is
 * the side effect).
 */
function redirectToSignIn() {
  if (typeof window === 'undefined') return
  storage.clearAccessToken()
  const here = window.location.pathname + window.location.search
  // Don't loop if we're already on an auth screen.
  if (/^\/(sign-in|sign-up|verify-otp|forgot-password|reset-password|complete-invite|select-tenant|onboarding)/.test(window.location.pathname)) {
    return
  }
  const returnTo = encodeURIComponent(here)
  window.location.assign(`/sign-in?returnTo=${returnTo}`)
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
  headers?: Record<string, string>
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = false, signal, headers = {} } = options

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  }

  if (auth) {
    const token = storage.getAccessToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  const text = await res.text()
  const data = text ? safeJson(text) : null

  // 401 on an authed call → the JWT is gone or expired. Bounce to sign-in
  // and abort the chain. Do this BEFORE throwing so callers don't surface
  // a "Failed to load X" toast for what's really an auth state issue.
  if (res.status === 401 && auth) {
    redirectToSignIn()
    throw new ApiError('Session expired', 401, data)
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || res.statusText || 'Request failed'
    throw new ApiError(String(message), res.status, data)
  }

  // Backend wraps responses as { success, data, error, statusCode }
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      if (data.statusCode === 401 && auth) {
        redirectToSignIn()
      }
      throw new ApiError(
        String(data.error ?? data.message ?? 'Request failed'),
        data.statusCode ?? res.status,
        data.data,
      )
    }
    return data.data as T
  }

  return data as T
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
