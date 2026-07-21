import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowDownIcon, ArrowUpIcon } from '../../../src/components/ui/icons'
import { Sparkline } from './Sparkline'

type Props = {
  label: string
  value: string
  subValue?: string
  icon: ReactNode
  iconBg: string
  iconColor: string
  href?: string
  trend?: { dir: 'up' | 'down'; pct: number; period: string; points?: number[] }
}

export function KpiCard({ label, value, subValue, icon, iconBg, iconColor, href, trend }: Props) {
  const inner = (
    <div className="rounded-2xl bg-white border border-ink-200 p-4 flex flex-col gap-3 h-full hover:shadow-[0_4px_16px_-8px_rgba(15,23,42,0.1)] hover:border-ink-300 transition-all">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11.5px] font-semibold text-ink-500 uppercase tracking-wide">
          {label}
        </p>
        <div
          className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor} [&>svg]:h-3.5 [&>svg]:w-3.5`}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="text-[20px] font-bold text-ink-900 tracking-tight leading-none">
          {value}
        </p>
        {subValue && (
          <p className="mt-1 text-[11px] text-ink-500 font-medium">{subValue}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto">
        {trend ? (
          <div className="flex items-center gap-1 text-[11.5px] font-semibold">
            <span
              className={[
                'inline-flex items-center gap-0.5',
                trend.dir === 'up' ? 'text-emerald-600' : 'text-red-600',
              ].join(' ')}
            >
              {trend.dir === 'up' ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />}
              {trend.pct}%
            </span>
            <span className="text-ink-400 font-medium">{trend.period}</span>
          </div>
        ) : (
          <div />
        )}
        {trend?.points && (
          <Sparkline points={trend.points} trend={trend.dir} width={64} height={22} />
        )}
      </div>
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  )
}
