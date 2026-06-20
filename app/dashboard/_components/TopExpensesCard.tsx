import { ChevronDownIcon } from '../../../src/components/ui/icons'
import { formatNaira } from '../../../src/lib/format'

type Segment = { label: string; value: number; color: string }

const segments: Segment[] = [
  { label: 'Salaries & Wages', value: 6075000, color: '#a78bfa' },
  { label: 'Purchases', value: 3510000, color: '#ec4899' },
  { label: 'Rent and Utilities', value: 1620000, color: '#f59e0b' },
  { label: 'Transportation & Logistics', value: 1080000, color: '#facc15' },
  { label: 'Others Expenses', value: 1215000, color: '#10b981' },
]

export function TopExpensesCard() {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const radius = 62
  const stroke = 22
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="rounded-2xl bg-white border border-ink-200 p-5 relative">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[14px] font-bold text-ink-900">Top Expenses</h3>
        <button className="h-7 rounded-lg border border-ink-200 px-2 flex items-center gap-1 text-[11.5px] font-semibold text-ink-700">
          This Month <ChevronDownIcon size={12} className="text-ink-400" />
        </button>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width={170} height={170} viewBox="0 0 170 170">
            {segments.map((seg) => {
              const len = (seg.value / total) * circumference
              const dash = `${len} ${circumference - len}`
              const dashOffset = -offset
              offset += len
              return (
                <circle
                  key={seg.label}
                  cx={85}
                  cy={85}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={dash}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 85 85)"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[13px] font-bold text-ink-900">{formatNaira(total / 1000 * 1000, { compact: false })}</p>
            <p className="text-[10px] text-ink-500 font-medium">Total expenses</p>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {segments.map((seg) => {
            const pct = ((seg.value / total) * 100).toFixed(0)
            return (
              <div key={seg.label} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: seg.color }}
                />
                <span className="text-[11.5px] text-ink-700 font-medium flex-1 truncate">
                  {seg.label}
                </span>
                <span className="text-[11.5px] text-ink-900 font-semibold tabular-nums">
                  {formatNaira(seg.value, { compact: false })}
                </span>
                <span className="text-[11px] text-ink-500 font-semibold w-7 text-right tabular-nums">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-4 text-[11.5px] font-semibold text-brand-600">
        ↗ Top expense: Salaries & Wages (45%)
      </p>
    </div>
  )
}
