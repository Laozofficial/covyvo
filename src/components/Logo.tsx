type Props = {
  className?: string
  variant?: 'dark' | 'light'
}

export function Logo({ className = '', variant = 'dark' }: Props) {
  const color = variant === 'light' ? 'text-white' : 'text-ink-900'
  return (
    <div className={`flex items-center gap-2 ${color} ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white font-bold">
        C
      </span>
      <span className="text-xl font-semibold tracking-tight">Covyvo</span>
    </div>
  )
}
