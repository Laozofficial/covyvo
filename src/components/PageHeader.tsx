import { ReactNode } from 'react'

type Props = {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[20px] font-bold text-ink-900 tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-[12.5px] text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
