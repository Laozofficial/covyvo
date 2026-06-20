'use client'

import { BellIcon, BranchIcon, ChevronDownIcon, SearchIcon } from './ui/icons'

export function TopBar({ branch = 'Branch' }: { branch?: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-ink-50">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            size={16}
          />
          <input
            type="search"
            placeholder="Search for anything..."
            className="w-full h-10 rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-[12.5px] font-medium text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="relative h-10 w-10 rounded-xl border border-ink-200 bg-white flex items-center justify-center text-ink-600 hover:text-ink-900 hover:border-ink-300 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon size={16} />
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <button
          type="button"
          className="h-10 rounded-xl border border-ink-200 bg-white px-3 flex items-center gap-2 text-[12.5px] font-semibold text-ink-700 hover:border-ink-300 transition-colors"
        >
          <BranchIcon size={14} className="text-ink-400" />
          {branch}
          <ChevronDownIcon size={14} className="text-ink-400" />
        </button>
      </div>
    </div>
  )
}
