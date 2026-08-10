'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plan } from '../lib/billing-api'
import { PlanGate, planLabel } from '../lib/plan-access'
import { formatMoney } from '../lib/finance-api'
import { LockClosedIcon, SparklesIcon } from './ui/icons'

export function UpgradeLock({
  gate,
  currentPlan,
  plans,
}: {
  gate: PlanGate
  currentPlan: string
  plans: Plan[]
}) {
  const router = useRouter()
  const target = plans.find((p) => p.code === gate.minPlan)
  const targetName = target?.name ?? planLabel(gate.minPlan)

  const perks = [
    `${gate.feature} — full access`,
    'HR & payroll',
    'Tax compliance',
    'Employee self-service',
    'Ask Ada AI (full)',
  ]

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm">
        {/* Header band */}
        <div className="relative bg-gradient-to-br from-brand-600 to-violet-700 px-8 pt-8 pb-10 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <span className="[&>svg]:h-6 [&>svg]:w-6"><LockClosedIcon size={22} /></span>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-white/70">
            {targetName} feature
          </p>
          <h1 className="mt-1 text-[24px] font-bold leading-tight">{gate.feature} is locked</h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/85">{gate.blurb}</p>
        </div>

        <div className="px-8 py-6">
          <p className="text-[13px] text-ink-600">
            You&apos;re on the <span className="font-semibold text-ink-900">{planLabel(currentPlan)}</span> plan.
            Upgrade to <span className="font-semibold text-ink-900">{targetName}</span> to unlock this area —
            including its forms, records and reports.
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-[12.5px] text-ink-700">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                {perk}
              </li>
            ))}
          </ul>

          {target && (
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[24px] font-bold text-ink-900">{formatMoney(target.monthlyPrice, 'NGN')}</span>
              <span className="text-[12px] text-ink-400">/ month</span>
              <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">7-day free trial</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-brand-700"
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4"><SparklesIcon /></span>
              Upgrade to {targetName}
            </Link>
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex items-center rounded-xl border border-ink-200 px-4 py-2.5 text-[13px] font-semibold text-ink-700 hover:bg-ink-50"
            >
              Compare all plans
            </Link>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center rounded-xl px-3 py-2.5 text-[13px] font-semibold text-ink-500 hover:text-ink-800"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
