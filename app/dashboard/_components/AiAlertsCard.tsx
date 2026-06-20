'use client'

import { useState } from 'react'
import { AlertTriangleIcon, ArrowRightIcon, SparklesIcon } from '../../../src/components/ui/icons'

type Risk = 'High Risk' | 'Medium Risk' | 'Low Risk'
type Alert = { id: string; title: string; risk: Risk }

const alerts: Alert[] = [
  { id: '1', title: '3 vendor payments missing WHT deduction', risk: 'High Risk' },
  { id: '2', title: 'PAYE Monthly Return is due in 7 days', risk: 'Medium Risk' },
  { id: '3', title: '2 vendor duplicate payment risk detected', risk: 'High Risk' },
]

const riskStyles: Record<Risk, string> = {
  'High Risk': 'text-red-600',
  'Medium Risk': 'text-amber-600',
  'Low Risk': 'text-emerald-600',
}

export function AiAlertsCard() {
  const [closed, setClosed] = useState(false)
  if (closed) return null

  const critical = alerts.filter((a) => a.risk === 'High Risk').length

  return (
    <div className="rounded-2xl bg-white border border-ink-200 p-4 mb-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center">
            <SparklesIcon size={14} />
          </span>
          <h3 className="text-[13.5px] font-bold text-ink-900">AI Compliance Alerts</h3>
          {critical > 0 && (
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
              {critical} critical
            </span>
          )}
        </div>
        <button
          onClick={() => setClosed(true)}
          className="text-[11.5px] font-semibold text-red-500 hover:text-red-700"
        >
          Close card
        </button>
      </div>
      <p className="text-[11.5px] text-ink-500 mb-3">issues that require your attention</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-ink-200 bg-ink-50/40 p-3 flex flex-col gap-2"
          >
            <AlertTriangleIcon size={16} className="text-amber-500" />
            <p className="text-[12px] font-semibold text-ink-800 leading-snug">{a.title}</p>
            <p className={`text-[11px] font-semibold mt-auto ${riskStyles[a.risk]}`}>
              {a.risk}
            </p>
          </div>
        ))}
        <button className="rounded-xl border border-dashed border-ink-200 bg-white p-3 flex items-center justify-center gap-1 text-[12px] font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
          View all alerts <ArrowRightIcon size={12} />
        </button>
      </div>
    </div>
  )
}
