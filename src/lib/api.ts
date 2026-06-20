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

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || res.statusText || 'Request failed'
    throw new ApiError(String(message), res.status, data)
  }

  // Backend wraps responses as { success, data, error, statusCode }
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
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
