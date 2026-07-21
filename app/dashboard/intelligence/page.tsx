'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmptyState } from '../../../src/components/EmptyState'
import { PageHeader } from '../../../src/components/PageHeader'
import { Alert } from '../../../src/components/ui/Alert'
import {
  AlertTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '../../../src/components/ui/icons'
import { ApiError } from '../../../src/lib/api'
import {
  IntelSignal,
  Insights,
  intelligenceApi,
} from '../../../src/lib/insights-api'

const SEVERITY = {
  critical: { chip: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', border: 'border-l-rose-400' },
  warning: { chip: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', border: 'border-l-amber-400' },
  info: { chip: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', border: 'border-l-sky-400' },
}

export default function IntelligencePage() {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    intelligenceApi
      .insights()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load intelligence'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title="Compliance Intelligence"
        description="Automated alerts, payroll anomaly detection and risk monitoring across your data."
        actions={
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('covyvo:open-ada'))}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white px-3 py-2 text-[12.5px] font-semibold"
          >
            <SparklesIcon size={15} /> Ask Ada
          </button>
        }
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : !data ? null : data.summary.total === 0 ? (
        <EmptyState icon={<ShieldCheckIcon />} title="All clear" description="No compliance alerts, payroll anomalies or risks detected right now." />
      ) : (
        <div className="space-y-5">
          <Group title="Compliance Alerts" icon={<ShieldCheckIcon />} signals={data.alerts} empty="No compliance items due." />
          <Group title="Payroll Anomaly Detection" icon={<AlertTriangleIcon />} signals={data.anomalies} empty="No payroll anomalies detected." />
          <Group title="Risk Monitoring" icon={<AlertTriangleIcon />} signals={data.risks} empty="No elevated risks." />
        </div>
      )}
    </>
  )
}

function Group({ title, icon, signals, empty }: { title: string; icon: React.ReactNode; signals: IntelSignal[]; empty: string }) {
  return (
    <div>
      <h2 className="text-[13px] font-bold text-ink-900 flex items-center gap-2 mb-2">
        <span className="text-brand-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {title}
        <span className="text-[11px] font-semibold text-ink-400">{signals.length}</span>
      </h2>
      {signals.length === 0 ? (
        <p className="text-[12.5px] text-ink-400 pl-6">{empty}</p>
      ) : (
        <div className="space-y-2">
          {signals.map((s) => {
            const meta = SEVERITY[s.severity]
            const body = (
              <div className={`rounded-xl border border-ink-200 border-l-4 ${meta.border} bg-white p-3.5 flex items-start gap-3 hover:border-ink-300`}>
                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-ink-900">{s.title}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${meta.chip}`}>{s.severity}</span>
                  </div>
                  <p className="text-[12px] text-ink-600 mt-0.5">{s.detail}</p>
                </div>
                {s.actionUrl && <span className="text-[12px] font-semibold text-brand-600 shrink-0">View →</span>}
              </div>
            )
            return s.actionUrl ? <Link key={s.code + s.title} href={s.actionUrl} className="block">{body}</Link> : <div key={s.code + s.title}>{body}</div>
          })}
        </div>
      )}
    </div>
  )
}
