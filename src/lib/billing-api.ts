import { api } from './api'

export type Plan = {
  id: string
  code: string
  name: string
  description: string | null
  monthlyPrice: string
  annualPrice: string | null
  maxBranches: number | null
  maxUsers: number | null
  maxEmployees: number | null
  aiOpsMonthly: number | null
}

export type Subscription = {
  id: string
  planId: string
  plan?: Plan
  cycle: 'monthly' | 'annual'
  status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'canceled'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  addOns?: { code: string; quantity: number }[] | null
}

export type BillingInvoice = {
  id: string
  description: string
  amount: string
  vat: string
  total: string
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'void'
  dueDate: string | null
  paidAt: string | null
  createdAt: string
}

export type CreditWallet = {
  purchased: number
  monthlyIncluded: number
  monthlyUsed: number
  available: number
}

export type CreditPack = {
  id: string
  type: 'invoice' | 'ai'
  quantity: number
  price: string
  isActive: boolean
}

export const billingApi = {
  subscription: () =>
    api<{ subscription: Subscription | null; invoices: BillingInvoice[] }>('/billing/subscription', { auth: true }),
  credits: () => api<{ invoice: CreditWallet; ai: CreditWallet }>('/billing/credits', { auth: true }),
  invoices: () => api<BillingInvoice[]>('/billing/invoices', { auth: true }),
  plans: () => api<Plan[]>('/billing/plans', { auth: true }),
  packs: () => api<CreditPack[]>('/billing/packs', { auth: true }),
  checkout: (invoiceId: string) =>
    api<{ authorizationUrl: string }>(`/billing/invoices/${invoiceId}/checkout`, { method: 'POST', auth: true }),
  buyCredits: (packId: string) =>
    api<BillingInvoice>('/billing/credits/buy', { method: 'POST', body: { packId }, auth: true }),

  addons: () => api<Addon[]>('/billing/addons', { auth: true }),
  limits: () => api<EffectiveLimits>('/billing/limits', { auth: true }),
  subscribe: (planId: string, cycle: 'monthly' | 'annual') =>
    api('/billing/subscribe', { method: 'POST', body: { planId, cycle }, auth: true }),
  changePlan: (planId: string, cycle: 'monthly' | 'annual') =>
    api('/billing/change-plan', { method: 'POST', body: { planId, cycle }, auth: true }),
  cancel: () => api('/billing/cancel', { method: 'POST', auth: true }),
  resume: () => api('/billing/resume', { method: 'POST', auth: true }),
  setAddons: (addOns: { code: string; quantity: number }[]) =>
    api('/billing/addons', { method: 'POST', body: { addOns }, auth: true }),
}

export type Addon = {
  id: string
  code: string
  name: string
  type: 'feature' | 'branch' | 'user' | 'employee'
  monthlyPrice: string
  unitQty: number
  isActive: boolean
}

export type EffectiveLimits = {
  hasSubscription: boolean
  status?: string
  maxBranches: number | null
  maxUsers: number | null
  maxEmployees: number | null
}

export function statusMeta(s: Subscription['status']) {
  const map: Record<string, { label: string; chip: string }> = {
    trialing: { label: 'Trial', chip: 'bg-violet-50 text-violet-700' },
    active: { label: 'Active', chip: 'bg-emerald-50 text-emerald-700' },
    past_due: { label: 'Past due', chip: 'bg-amber-50 text-amber-700' },
    suspended: { label: 'Suspended', chip: 'bg-rose-50 text-rose-700' },
    canceled: { label: 'Canceled', chip: 'bg-ink-100 text-ink-600' },
  }
  return map[s] ?? map.canceled
}
