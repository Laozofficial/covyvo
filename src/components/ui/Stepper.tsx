type Step = { label: string }

type Props = {
  steps: Step[]
  current: number // 0-indexed
}

export function Stepper({ steps, current }: Props) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        {steps.map((step, i) => {
          const state =
            i < current ? 'done' : i === current ? 'current' : 'upcoming'
          return (
            <div key={step.label} className="flex-1 flex items-center gap-2">
              <div
                className={[
                  'flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold shrink-0 transition-colors',
                  state === 'done'
                    ? 'bg-brand-600 text-white'
                    : state === 'current'
                    ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-600'
                    : 'bg-ink-100 text-ink-400',
                ].join(' ')}
              >
                {state === 'done' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 rounded-full transition-colors',
                    i < current ? 'bg-brand-600' : 'bg-ink-200',
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between">
        {steps.map((step, i) => (
          <span
            key={step.label}
            className={[
              'text-[11px] font-medium',
              i === current ? 'text-brand-700' : 'text-ink-400',
              i === 0 ? 'text-left' : i === steps.length - 1 ? 'text-right' : 'text-center',
            ].join(' ')}
            style={{ width: `${100 / steps.length}%` }}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export const REGISTRATION_STEPS: Step[] = [
  { label: 'Your account' },
  { label: 'Verify email' },
  { label: 'Company setup' },
]
