import { ReactNode } from 'react'

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-8 py-16 flex flex-col items-center text-center">
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-[12.5px] text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
