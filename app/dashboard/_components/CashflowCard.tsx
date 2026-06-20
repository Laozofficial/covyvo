import { CreditCardIcon } from '../../../src/components/ui/icons'
import { formatNaira } from '../../../src/lib/format'

type Day = { date: string; inflow: number; outflow: number; net: number }

const data: Day[] = [
  { date: 'Apr 18', inflow: 12, outflow: 8, net: 4 },
  { date: 'Apr 19', inflow: 18, outflow: 14, net: 4 },
  { date: 'Apr 20', inflow: 22, outflow: 28, net: -6 },
  { date: 'Apr 21', inflow: 24, outflow: 30, net: -6 },
  { date: 'Apr 22', inflow: 30, outflow: 40, net: -10 },
  { date: 'Apr 23', inflow: 38, outflow: 48, net: -10 },
]

export function CashflowCard() {
  const max = Math.max(...data.flatMap((d) => [d.inflow, d.outflow, Math.abs(d.net)]))
  const chartHeight = 180
  const barWidth = 8
  const groupWidth = 50

  return (
    <div className="rounded-2xl bg-white border border-ink-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[14px] font-bold text-ink-900">Cash flow summary</h3>
        <span className="text-[11.5px] text-ink-500 font-medium">Last 7 days</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Stat label="Cash Inflow" value={formatNaira(23000220)} dotClass="bg-emerald-500" iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        <Stat label="Cash Outflow" value={formatNaira(23000220)} dotClass="bg-red-500" iconColor="text-red-500" iconBg="bg-red-50" />
        <Stat label="Net Cash Outflow" value={formatNaira(23000220)} dotClass="bg-brand-500" iconColor="text-brand-600" iconBg="bg-brand-50" icon />
      </div>

      <div className="relative">
        {/* Y axis labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-ink-400 font-medium">
          {[50, 40, 30, 20, 10, 0].map((v) => (
            <span key={v}>{v}M</span>
          ))}
        </div>
        <div className="ml-7">
          <svg
            viewBox={`0 0 ${data.length * groupWidth} ${chartHeight}`}
            width="100%"
            height={chartHeight}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line
                key={i}
                x1={0}
                x2={data.length * groupWidth}
                y1={(chartHeight / 5) * i}
                y2={(chartHeight / 5) * i}
                stroke="#eceef2"
                strokeWidth={1}
              />
            ))}
            {data.map((d, i) => {
              const cx = i * groupWidth + groupWidth / 2
              const inH = (d.inflow / max) * chartHeight
              const outH = (d.outflow / max) * chartHeight
              const netH = (Math.abs(d.net) / max) * chartHeight
              return (
                <g key={d.date}>
                  <rect
                    x={cx - barWidth * 1.7}
                    y={chartHeight - inH}
                    width={barWidth}
                    height={inH}
                    fill="#10b981"
                    rx={2}
                  />
                  <rect
                    x={cx - barWidth * 0.5}
                    y={chartHeight - outH}
                    width={barWidth}
                    height={outH}
                    fill="#ef4444"
                    rx={2}
                  />
                  <rect
                    x={cx + barWidth * 0.7}
                    y={chartHeight - netH}
                    width={barWidth}
                    height={netH}
                    fill="#1a3a6b"
                    rx={2}
                  />
                </g>
              )
            })}
          </svg>
          <div className="flex">
            {data.map((d) => (
              <div
                key={d.date}
                className="flex-1 text-center text-[10.5px] text-ink-500 font-medium pt-1.5"
              >
                {d.date}
              </div>
            ))}
          </div>
        </div>
      </div>

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
