'use client'

import { useEffect, useState } from 'react'
import { EffectiveLimits, billingApi } from './billing-api'

// Cached once per full page load; upgrades trigger a reload so it refreshes.
let cache: EffectiveLimits | null = null

export function usePlanLimits() {
  const [limits, setLimits] = useState<EffectiveLimits | null>(cache)
  const [ready, setReady] = useState(!!cache)

  useEffect(() => {
    if (cache) return
    let alive = true
    billingApi
      .limits()
      .then((l) => {
        if (!alive) return
        cache = l
        setLimits(l)
        setReady(true)
      })
      .catch(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, [])

  return { limits, ready }
}

export type LimitResource = 'branch' | 'user' | 'employee'

export function capFor(limits: EffectiveLimits | null, resource: LimitResource): number | null {
  if (!limits) return null
  const map: Record<LimitResource, number | null> = {
    branch: limits.maxBranches,
    user: limits.maxUsers,
    employee: limits.maxEmployees,
  }
  return map[resource] ?? null
}

/** True when the tenant has hit (or exceeded) their plan cap for a resource. */
export function isAtLimit(limits: EffectiveLimits | null, resource: LimitResource, count: number): boolean {
  const cap = capFor(limits, resource)
  return cap !== null && count >= cap
}
