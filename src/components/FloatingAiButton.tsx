'use client'

import { useEffect, useRef, useState } from 'react'
import { AskAdaPanel } from './AskAdaPanel'
import { SparklesIcon } from './ui/icons'

const STORAGE_KEY = 'covyvo.ai_button_pos'
const SIZE = 52
const MARGIN = 16

type Pos = { x: number; y: number }

function clamp(p: Pos): Pos {
  if (typeof window === 'undefined') return p
  return {
    x: Math.max(MARGIN, Math.min(window.innerWidth - SIZE - MARGIN, p.x)),
    y: Math.max(MARGIN, Math.min(window.innerHeight - SIZE - MARGIN, p.y)),
  }
}

export function FloatingAiButton() {
  const [pos, setPos] = useState<Pos | null>(null)
  const [dragging, setDragging] = useState(false)
  const [open, setOpen] = useState(false)
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const movedRef = useRef(false)

  // Global open hook — sidebar (or anywhere) can dispatch a
  // "covyvo:open-ada" event and the panel pops up.
  useEffect(() => {
    function onOpen() { setOpen(true) }
    window.addEventListener('covyvo:open-ada', onOpen)
    return () => window.removeEventListener('covyvo:open-ada', onOpen)
  }, [])

  // Initial position: restore from storage or default bottom-right
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Pos
        setPos(clamp(parsed))
        return
      }
    } catch {}
    setPos({
      x: window.innerWidth - SIZE - 32,
      y: window.innerHeight - SIZE - 32,
    })
  }, [])

  // Re-clamp on window resize so the button never falls off-screen
  useEffect(() => {
    function onResize() {
      setPos((p) => (p ? clamp(p) : p))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Drag listeners
  useEffect(() => {
    if (!dragging) return

    function onMove(clientX: number, clientY: number) {
      const next = clamp({
        x: clientX - offsetRef.current.dx,
        y: clientY - offsetRef.current.dy,
      })
      movedRef.current = true
      setPos(next)
    }

    function onMouseMove(e: MouseEvent) {
      onMove(e.clientX, e.clientY)
    }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0]
      if (!t) return
      e.preventDefault()
      onMove(t.clientX, t.clientY)
    }
    function onUp() {
      setDragging(false)
      setPos((p) => {
        if (p) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
          } catch {}
        }
        return p
      })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging])

  function startDrag(clientX: number, clientY: number) {
    if (!pos) return
    offsetRef.current = { dx: clientX - pos.x, dy: clientY - pos.y }
    movedRef.current = false
    setDragging(true)
  }

  function onClick() {
    if (movedRef.current) return
    setOpen(true)
  }

  if (!pos) return null

  return (
    <>
    <button
      type="button"
      aria-label="Ask AI"
      onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const t = e.touches[0]
        if (t) startDrag(t.clientX, t.clientY)
      }}
      onClick={onClick}
      style={{
        left: pos.x,
        top: pos.y,
        width: SIZE,
        height: SIZE,
        touchAction: 'none',
      }}
      className={[
        'fixed z-50 rounded-full select-none',
        'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white',
        'flex items-center justify-center',
        'shadow-[0_10px_28px_-8px_rgba(139,92,246,0.55)]',
        dragging
          ? 'cursor-grabbing scale-105 shadow-[0_14px_36px_-8px_rgba(139,92,246,0.7)]'
          : 'cursor-grab hover:scale-105 transition-transform',
      ].join(' ')}
    >
      <SparklesIcon size={20} />
    </button>
    <AskAdaPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
