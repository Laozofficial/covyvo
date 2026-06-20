'use client'

import { CalendarIcon, ChevronDownIcon, SparklesIcon } from '../../../src/components/ui/icons'

type Props = { name: string }

export function DashboardHeader({ name }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-ink-200 px-5 py-4 mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[18px] font-bold text-ink-900 flex items-center gap-2">
          Good morning, {name}! <span aria-hidden>👋</span>
        </h1>
        <p className="mt-0.5 text-[12px] text-ink-500 font-medium">
          Here's what's happening with your business today
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="h-8 w-8 rounded-full border border-ink-200 bg-white flex items-center justify-center text-violet-600">
          <SparklesIcon size={14} />
        </span>
        <button className="h-9 rounded-lg border border-ink-200 px-3 flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 hover:border-ink-300">
          Filter
          <ChevronDownIcon size={12} className="text-ink-400" />
        </button>
        <button className="h-9 rounded-lg border border-ink-200 px-3 flex items-center gap-1.5 text-[12px] font-semibold text-ink-700 hover:border-ink-300">
          <CalendarIcon size={14} className="text-ink-400" />
          April 17 – April 23, 2026
        </button>
      </div>
    </div>
  )
}
