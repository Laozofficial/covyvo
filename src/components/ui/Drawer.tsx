'use client'

import { ReactNode, useEffect, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  /** Compact width (px). Default 460. */
  width?: number
  /** Initial size: 'compact' (default) or 'expanded' (~75% viewport). */
  defaultSize?: 'compact' | 'expanded'
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 460,
  defaultSize = 'compact',
}: Props) {
  const [expanded, setExpanded] = useState(defaultSize === 'expanded')

  // Reset to default size whenever the drawer is opened
  useEffect(() => {
    if (open) setExpanded(defaultSize === 'expanded')
  }, [open, defaultSize])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const panelStyle = expanded
    ? { width: 'min(1100px, 90vw)' }
    : { width }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={[
          'fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[2px] transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        style={panelStyle}
        className={[
          'fixed inset-y-0 right-0 z-50 bg-white shadow-[0_0_40px_-8px_rgba(15,23,42,0.25)]',
          'transition-[transform,width] duration-200 ease-out',
          'flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-ink-100">
          <div className="min-w-0">
            <h2
              id="drawer-title"
              className="text-[15px] font-bold text-ink-900 tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[12px] text-ink-500">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Collapse' : 'Expand'}
              title={expanded ? 'Collapse' : 'Expand'}
              className="h-8 w-8 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100 flex items-center justify-center transition-colors"
            >
              {expanded ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100 flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="border-t border-ink-100 px-5 py-3 bg-ink-50/40">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
