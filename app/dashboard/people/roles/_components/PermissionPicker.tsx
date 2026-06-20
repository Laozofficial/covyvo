'use client'

import { PermissionGroup } from '../../../../../src/lib/roles-api'

type Props = {
  catalog: PermissionGroup[]
  value: Set<string>
  onChange: (next: Set<string>) => void
  disabled?: boolean
}

export function PermissionPicker({ catalog, value, onChange, disabled }: Props) {
  function toggle(key: string) {
    if (disabled) return
    const next = new Set(value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(next)
  }

  function toggleGroup(group: PermissionGroup, allOn: boolean) {
    if (disabled) return
    const next = new Set(value)
    for (const p of group.permissions) {
      if (allOn) next.delete(p.key)
      else next.add(p.key)
    }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {catalog.map((group) => {
        const groupKeys = group.permissions.map((p) => p.key)
        const checkedCount = groupKeys.filter((k) => value.has(k)).length
        const allOn = checkedCount === groupKeys.length
        const someOn = checkedCount > 0 && !allOn

        return (
          <div
            key={group.key}
            className="rounded-xl border border-ink-200 bg-white"
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-ink-100">
              <div>
                <h4 className="text-[13px] font-bold text-ink-900">
                  {group.label}
                </h4>
                <p className="text-[11.5px] text-ink-500 mt-0.5">
                  {group.description}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleGroup(group, allOn)}
                className={[
                  'text-[11.5px] font-semibold px-2.5 py-1 rounded-md transition-colors shrink-0',
                  allOn
                    ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    : someOn
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100',
                  disabled && 'opacity-60 cursor-not-allowed',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {allOn ? 'All on' : someOn ? `${checkedCount}/${groupKeys.length}` : 'Off'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink-100">
              <div className="sm:contents">
                {group.permissions.map((p) => {
                  const checked = value.has(p.key)
                  return (
                    <label
                      key={p.key}
                      className={[
                        'flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-ink-50/60 transition-colors',
                        disabled && 'opacity-60 cursor-not-allowed',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="relative inline-flex shrink-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.key)}
                          disabled={disabled}
                          className="peer appearance-none h-[16px] w-[16px] rounded border border-ink-300 bg-white checked:bg-brand-600 checked:border-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        />
                        <svg
                          className="pointer-events-none absolute inset-0 m-auto h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-ink-800 truncate">
                          {p.label}
                        </p>
                        <p className="text-[10.5px] text-ink-400 font-mono truncate">
                          {p.key}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
