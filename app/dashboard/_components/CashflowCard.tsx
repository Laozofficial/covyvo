import { CreditCardIcon } from '../../../src/components/ui/icons'
import { formatNaira } from '../../../src/lib/format'

type Day = { date: string; inflow: number; outflow: number; net: number }

export function CashflowCard({ data = [] }: { data?: Day[] }) {
  const totalIn = data.reduce((s, d) => s + d.inflow, 0)
  const totalOut = data.reduce((s, d) => s + d.outflow, 0)
  const net = totalIn - totalOut
  const max = Math.max(1, ...data.flatMap((d) => [d.inflow, d.outflow, Math.abs(d.net)]))
  const hasActivity = totalIn > 0 || totalOut > 0

  const chartHeight = 180
  const barWidth = 8
  const groupWidth = data.length ? Math.max(24, 700 / data.length) : 50

  return (
    <div className="rounded-2xl bg-white border border-ink-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[14px] font-bold text-ink-900">Cash flow summary</h3>
        <span className="text-[11.5px] text-ink-500 font-medium">Last 14 days</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Stat label="Cash Inflow" value={formatNaira(totalIn)} dotClass="bg-emerald-500" iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        <Stat label="Cash Outflow" value={formatNaira(totalOut)} dotClass="bg-red-500" iconColor="text-red-500" iconBg="bg-red-50" />
        <Stat label={net >= 0 ? 'Net Cash Inflow' : 'Net Cash Outflow'} value={formatNaira(Math.abs(net))} dotClass="bg-brand-500" iconColor="text-brand-600" iconBg="bg-brand-50" icon />
      </div>

      {!hasActivity ? (
        <div className="h-[180px] flex flex-col items-center justify-center text-center">
          <p className="text-[12.5px] font-semibold text-ink-600">No cash movement yet</p>
          <p className="text-[11.5px] text-ink-400 mt-1">Invoice payments and payroll payouts will show here.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Y axis labels — dynamic from max */}
          <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-ink-400 font-medium">
            {[1, 0.8, 0.6, 0.4, 0.2, 0].map((f) => (
              <span key={f}>{formatNaira(max * f, { compact: true })}</span>
            ))}
          </div>
          <div className="ml-9">
            <svg
              viewBox={`0 0 ${data.length * groupWidth} ${chartHeight}`}
              width="100%"
              height={chartHeight}
              preserveAspectRatio="none"
            >
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line key={i} x1={0} x2={data.length * groupWidth} y1={(chartHeight / 5) * i} y2={(chartHeight / 5) * i} stroke="#eceef2" strokeWidth={1} />
              ))}
              {data.map((d, i) => {
                const cx = i * groupWidth + groupWidth / 2
                const inH = (d.inflow / max) * chartHeight
                const outH = (d.outflow / max) * chartHeight
                const netH = (Math.abs(d.net) / max) * chartHeight
                return (
                  <g key={i}>
                    <rect x={cx - barWidth * 1.7} y={chartHeight - inH} width={barWidth} height={inH} fill="#10b981" rx={2} />
                    <rect x={cx - barWidth * 0.5} y={chartHeight - outH} width={barWidth} height={outH} fill="#ef4444" rx={2} />
                    <rect x={cx + barWidth * 0.7} y={chartHeight - netH} width={barWidth} height={netH} fill="#1a3a6b" rx={2} />
                  </g>
                )
              })}
            </svg>
            <div className="flex">
              {data.map((d, i) => (
                <div key={i} className="flex-1 text-center text-[9.5px] text-ink-400 font-medium pt-1.5">
                  {i % 2 === 0 ? d.date : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] font-medium">
        <Legend label="Inflow" color="bg-emerald-500" />
        <Legend label="Outflow" color="bg-red-500" />
        <Legend label="Net Cash Flow" color="bg-brand-700" />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  dotClass,
  iconBg,
  iconColor,
  icon,
}: {
  label: string
  value: string
  dotClass: string
  iconBg: string
  iconColor: string
  icon?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon ? (
          <CreditCardIcon size={12} className={iconColor} />
        ) : (
          <span className={`h-3 w-3 rounded-full ${dotClass}`} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] text-ink-500 font-medium">{label}</p>
        <p className="text-[13px] font-bold text-ink-900 truncate">{value}</p>
      </div>
    </div>
  )
}

function Legend({ label, color }: { label: string; color: string }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-600">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
