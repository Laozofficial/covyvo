'use client'

import { useEffect, useRef, useState } from 'react'
import { aiApi, type AdaMessage } from '../lib/ai-api'
import { SparklesIcon } from './ui/icons'

type Props = {
  open: boolean
  onClose: () => void
}

const SUGGESTIONS = [
  'How many invoices are overdue?',
  'Total unpaid across all invoices?',
  'How many employees do we have?',
  'Show me the last 5 purchase orders.',
]

export function AskAdaPanel({ open, onClose }: Props) {
  const [messages, setMessages] = useState<AdaMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      // Scroll to latest on open / message change
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
      })
    }
  }, [open, messages, sending])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function send(text: string) {
    const message = text.trim()
    if (!message || sending) return
    setError(null)
    setInput('')
    const nextHistory: AdaMessage[] = [
      ...messages,
      { role: 'user', text: message },
    ]
    setMessages(nextHistory)
    setSending(true)
    try {
      const res = await aiApi.chat(message, messages)
      setMessages([...nextHistory, { role: 'model', text: res.answer }])
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Something went wrong. Try again.'
      setError(msg)
      setMessages(nextHistory)
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setMessages([])
    setError(null)
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Ask Ada"
        className="fixed z-50 bg-white shadow-2xl border border-slate-200 flex flex-col
          right-4 bottom-4 w-[min(420px,calc(100vw-2rem))] h-[min(640px,calc(100vh-2rem))]
          rounded-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
          <SparklesIcon size={18} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold leading-tight">Ada</div>
            <div className="text-[11px] opacity-90 leading-tight">
              Your read-only data assistant
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="text-xs px-2 py-1 rounded bg-white/15 hover:bg-white/25"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none px-2 hover:opacity-80"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50"
        >
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Hi — I&apos;m Ada. Ask me anything about your business data.
                I can look things up but I can&apos;t change anything.
              </p>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Try
                </div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={[
                  'max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words',
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm',
                ].join(' ')}
              >
                {m.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-slate-500">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
          className="border-t border-slate-200 p-3 bg-white flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send(input)
              }
            }}
            placeholder="Ask about invoices, customers, employees…"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent max-h-28"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-lg bg-violet-600 text-white px-3 py-2 text-sm font-medium disabled:opacity-40 hover:bg-violet-700"
          >
            Send
          </button>
        </form>
      </div>
    </>
  )
}
