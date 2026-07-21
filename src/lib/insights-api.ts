import { api } from './api'

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

/* ── Audit trail ─────────────────────────────────────────────────────── */

export type AuditLog = {
  id: string
  userId: string | null
  userEmail: string | null
  userName: string | null
  action: string
  resource: string
  resourceId: string | null
  method: string
  path: string
  statusCode: number
  summary: string | null
  ipAddress: string | null
  createdAt: string
}

export const auditApi = {
  list: (q: { action?: string; resource?: string; search?: string; limit?: number } = {}) =>
    api<PagedList<AuditLog>>(`/audit${qs({ ...q, limit: q.limit ?? 50 })}`, { auth: true }),
}

/* ── Dashboard summary ───────────────────────────────────────────────── */

export type DashboardSummary = {
  kpis: {
    revenue: number
    collected: number
    expense: number
    grossProfit: number
    cashBalance: number
    walletBalance: number
    payrollThisMonth: number
    receivablesOutstanding: number
    procurementSpend: number
  }
  counts: {
    employees: number
    branches: number
    departments: number
    openInvoices: number
    totalInvoices: number
    pendingApprovals: number
    purchaseOrders: number
  }
  recentActivity: Array<{
    id: string
    action: string
    resource: string
    summary: string | null
    userName: string | null
    createdAt: string
  }>
}

export const dashboardApi = {
  summary: () => api<DashboardSummary>('/dashboard/summary', { auth: true }),
}

/* ── Compliance Intelligence ─────────────────────────────────────────── */

export type IntelSeverity = 'info' | 'warning' | 'critical'

export type IntelSignal = {
  code: string
  severity: IntelSeverity
  title: string
  detail: string
  actionUrl?: string
}

export type Insights = {
  generatedAt: string
  alerts: IntelSignal[]
  anomalies: IntelSignal[]
  risks: IntelSignal[]
  summary: { alerts: number; anomalies: number; risks: number; total: number }
}

export const intelligenceApi = {
  insights: () => api<Insights>('/intelligence/insights', { auth: true }),
}

/* ── Notifications ───────────────────────────────────────────────────── */

export type Notification = {
  id: string
  category: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  body: string | null
  actionUrl: string | null
  isRead: boolean
  createdAt: string
}

export const notificationsApi = {
  list: (q: { unreadOnly?: boolean; limit?: number } = {}) =>
    api<PagedList<Notification> & { unread: number }>(
      `/notifications${qs({ ...q, limit: q.limit ?? 20 })}`,
      { auth: true },
    ),
  unreadCount: () => api<{ unread: number }>('/notifications/unread-count', { auth: true }),
  markRead: (id: string) =>
    api<Notification>(`/notifications/${id}/read`, { method: 'POST', auth: true }),
  markAllRead: () =>
    api<{ message: string }>('/notifications/read-all', { method: 'POST', auth: true }),
}

/* ── helpers ─────────────────────────────────────────────────────────── */

export function auditActionMeta(action: string) {
  const map: Record<string, { chip: string }> = {
    create: { chip: 'bg-emerald-50 text-emerald-700' },
    update: { chip: 'bg-sky-50 text-sky-700' },
    delete: { chip: 'bg-rose-50 text-rose-700' },
    approve: { chip: 'bg-violet-50 text-violet-700' },
    compute: { chip: 'bg-amber-50 text-amber-700' },
    fund: { chip: 'bg-emerald-50 text-emerald-700' },
    run: { chip: 'bg-violet-50 text-violet-700' },
  }
  return map[action] ?? { chip: 'bg-ink-100 text-ink-700' }
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}
