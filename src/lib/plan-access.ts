// ── Plan-based feature access (frontend gating) ──────────────────────────
// Single source of truth for which routes require which plan. Retune here.

export const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  professional: 3,
  enterprise: 4,
  custom: 5,
}

export const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  professional: 'Professional',
  enterprise: 'Enterprise',
  custom: 'Custom',
}

export function planRank(code?: string | null): number {
  if (!code) return 0
  return PLAN_RANK[code] ?? 0
}

export type PlanGate = {
  /** Route prefix this gate covers (matches the path and everything under it). */
  prefix: string
  /** Cheapest plan code that unlocks the feature. */
  minPlan: string
  /** Human name of the locked capability. */
  feature: string
  /** One-line pitch shown on the lock screen. */
  blurb: string
}

/**
 * Gated areas. Anything not listed is available on every plan (incl. Free).
 * When paths overlap, the longest matching prefix wins.
 */
export const PLAN_GATES: PlanGate[] = [
  {
    prefix: '/dashboard/payroll',
    minPlan: 'starter',
    feature: 'Payroll',
    blurb: 'Run payroll, salary structures, tax schedules, disbursement wallet and bank files.',
  },
  {
    prefix: '/dashboard/people/employees',
    minPlan: 'starter',
    feature: 'HR & Employees',
    blurb: 'Manage employees, designations and the full HR record.',
  },
  {
    prefix: '/dashboard/people/designations',
    minPlan: 'starter',
    feature: 'HR & Employees',
    blurb: 'Manage employees, designations and the full HR record.',
  },
  {
    prefix: '/dashboard/compliance/tax-center',
    minPlan: 'starter',
    feature: 'Tax Compliance',
    blurb: 'Statutory remittance summaries and tax compliance tooling.',
  },
]

/** The gate covering a path, or null if the path is open to all plans. */
export function gateForPath(pathname: string): PlanGate | null {
  let match: PlanGate | null = null
  for (const g of PLAN_GATES) {
    if (pathname === g.prefix || pathname.startsWith(g.prefix + '/')) {
      if (!match || g.prefix.length > match.prefix.length) match = g
    }
  }
  return match
}

export function planLabel(code?: string | null): string {
  if (!code) return 'Free'
  return PLAN_LABEL[code] ?? code.charAt(0).toUpperCase() + code.slice(1)
}
