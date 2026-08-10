'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { Plan, billingApi } from '../lib/billing-api'
import { gateForPath, planRank } from '../lib/plan-access'
import { UpgradeLock } from './UpgradeLock'

// Module-level cache so navigating between pages doesn't refetch (or flash the
// lock). Reset naturally on a full page load (e.g. after an upgrade/checkout).
let cache: { planCode: string; plans: Plan[] } | null = null

export function PlanGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [ready, setReady] = useState(!!cache)
  const [planCode, setPlanCode] = useState(cache?.planCode ?? 'free')
  const [plans, setPlans] = useState<Plan[]>(cache?.plans ?? [])

  useEffect(() => {
    if (cache) return
    let alive = true
    Promise.all([
      billingApi.subscription().catch(() => ({ subscription: null, invoices: [] })),
      billingApi.plans().catch(() => [] as Plan[]),
    ]).then(([s, pl]) => {
      if (!alive) return
      const code = s.subscription?.plan?.code ?? 'free'
      cache = { planCode: code, plans: pl }
      setPlanCode(code)
      setPlans(pl)
      setReady(true)
    })
    return () => { alive = false }
  }, [])

  const gate = gateForPath(pathname)
  if (!gate) return <>{children}</>

  // Wait for entitlements before deciding, so we never flash a lock at a
  // paying customer or briefly show a gated page to a Free user.
  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    )
  }

  if (planRank(planCode) >= planRank(gate.minPlan)) return <>{children}</>
  return <UpgradeLock gate={gate} currentPlan={planCode} plans={plans} />
}
