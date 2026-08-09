'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Branch, branchesApi } from '../lib/hr-api'
import {
  Notification,
  notificationsApi,
  timeAgo,
} from '../lib/insights-api'
import { storage } from '../lib/storage'
import { billingApi } from '../lib/billing-api'
import { NAV_SEARCH_INDEX, NavDestination } from './Sidebar'
import {
  BellIcon,
  BranchIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  SearchIcon,
} from './ui/icons'

function scoreMatch(dest: NavDestination, q: string): number {
  const label = dest.label.toLowerCase()
  const group = dest.group.toLowerCase()
  if (label === q) return 100
  if (label.startsWith(q)) return 80
  if (label.includes(q)) return 60
  if (group.includes(q)) return 30
  // subsequence (fuzzy) fallback so "invtx" → "Invoices"
  let i = 0
  for (const ch of label) if (ch === q[i]) i++
  return i === q.length ? 10 : 0
}

export function TopBar() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null)
  const [branchOpen, setBranchOpen] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)

  // Billing status pill (auto-starts the trial on first fetch).
  const [billing, setBilling] = useState<{ status: string; daysLeft: number | null } | null>(null)
  useEffect(() => {
    billingApi
      .subscription()
      .then((r) => {
        const s = r.subscription
        if (!s) return setBilling(null)
        const end = s.status === 'trialing' ? s.trialEndsAt : s.currentPeriodEnd
        const daysLeft = end ? Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000)) : null
        setBilling({ status: s.status, daysLeft })
      })
      .catch(() => setBilling(null))
  }, [])

  const branchRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  // Global command-palette search over every sidebar destination.
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return [] as NavDestination[]
    return NAV_SEARCH_INDEX.map((d) => ({ d, s: scoreMatch(d, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.d)
  }, [query])

  function go(dest: NavDestination) {
    router.push(dest.href)
    setQuery('')
    setSearchOpen(false)
    searchInputRef.current?.blur()
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSearchOpen(true)
      setHighlight((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && results[highlight]) {
      e.preventDefault()
      go(results[highlight])
    } else if (e.key === 'Escape') {
      setSearchOpen(false)
      searchInputRef.current?.blur()
    }
  }

  // Cmd/Ctrl+K focuses the search from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => setHighlight(0), [query])

  // Load branches + restore the persisted active branch. Defaults to
  // "All branches" (no filter) unless a branch was previously chosen.
  useEffect(() => {
    branchesApi
      .list({ limit: 100 })
      .then((r) => {
        const list = r.data ?? []
        setBranches(list)
        const stored = storage.getActiveBranch<Branch>()
        const match = stored ? list.find((b) => b.id === stored.id) : null
        setActiveBranch(match ?? null)
        if (match) storage.setActiveBranch(match)
        else storage.clearActiveBranch()
      })
      .catch(() => undefined)
  }, [])

  // Notifications: initial load + poll every 60s.
  useEffect(() => {
    let alive = true
    const load = () =>
      notificationsApi
        .list({ limit: 15 })
        .then((r) => {
          if (!alive) return
          setNotifications(r.data ?? [])
          setUnread(r.unread ?? 0)
        })
        .catch(() => undefined)
    load()
    const t = setInterval(load, 60000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  // Close menus on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) setBranchOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  function selectBranch(b: Branch | null) {
    setActiveBranch(b)
    if (b) storage.setActiveBranch(b)
    else storage.clearActiveBranch()
    setBranchOpen(false)
    window.dispatchEvent(new CustomEvent('covyvo:branch-changed', { detail: b }))
  }

  async function openBell() {
    const next = !bellOpen
    setBellOpen(next)
    if (next && unread > 0) {
      try {
        await notificationsApi.markAllRead()
        setUnread(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-ink-50">
      <div ref={searchRef} className="flex-1 max-w-xl">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={onSearchKey}
            placeholder="Search pages… (⌘K)"
            className="w-full h-10 rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-[12.5px] font-medium text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />

          {searchOpen && query.trim() && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl border border-ink-200 bg-white shadow-xl z-50 overflow-hidden">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-[12px] text-ink-400">No pages match &ldquo;{query}&rdquo;.</p>
              ) : (
                <div className="py-1 max-h-[360px] overflow-y-auto">
                  {results.map((r, i) => (
                    <button
                      key={r.href}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => go(r)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left ${i === highlight ? 'bg-brand-50' : 'hover:bg-ink-50'}`}
                    >
                      <SearchIcon size={13} className="text-ink-300 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12.5px] font-semibold text-ink-900 truncate">{r.label}</span>
                      </span>
                      <span className="text-[10.5px] font-medium text-ink-400 shrink-0">{r.group}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Billing / trial status pill */}
        {billing && ['trialing', 'past_due', 'suspended'].includes(billing.status) && (
          <Link
            href="/dashboard/settings/billing"
            className={`hidden sm:inline-flex items-center gap-1.5 h-10 rounded-xl px-3 text-[12px] font-bold transition-colors ${
              billing.status === 'trialing'
                ? 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${billing.status === 'trialing' ? 'bg-violet-500' : 'bg-rose-500'}`} />
            {billing.status === 'trialing'
              ? `Free trial${billing.daysLeft != null ? ` · ${billing.daysLeft}d left` : ''}`
              : billing.status === 'past_due'
                ? 'Payment due'
                : 'Suspended'}
            <span className="opacity-70">· {billing.status === 'trialing' ? 'Subscribe' : 'Fix'}</span>
          </Link>
        )}

        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={openBell}
            className="relative h-10 w-10 rounded-xl border border-ink-200 bg-white flex items-center justify-center text-ink-600 hover:text-ink-900 hover:border-ink-300 transition-colors"
            aria-label="Notifications"
          >
            <BellIcon size={16} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-[340px] rounded-xl border border-ink-200 bg-white shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink-900">Notifications</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[12px] text-ink-400">You&apos;re all caught up.</p>
                ) : (
                  notifications.map((n) => {
                    const content = (
                      <div className="flex items-start gap-2.5 px-4 py-3 hover:bg-ink-50">
                        <span
                          className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                            n.severity === 'critical'
                              ? 'bg-red-500'
                              : n.severity === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-ink-900">{n.title}</p>
                          {n.body && <p className="text-[11.5px] text-ink-500 mt-0.5">{n.body}</p>}
                          <p className="text-[10.5px] text-ink-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    )
                    return n.actionUrl ? (
                      <Link key={n.id} href={n.actionUrl} onClick={() => setBellOpen(false)} className="block">
                        {content}
                      </Link>
                    ) : (
                      <div key={n.id}>{content}</div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Branch selector */}
        <div ref={branchRef} className="relative">
          <button
            type="button"
            onClick={() => setBranchOpen((v) => !v)}
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 flex items-center gap-2 text-[12.5px] font-semibold text-ink-700 hover:border-ink-300 transition-colors"
          >
            <BranchIcon size={14} className="text-ink-400" />
            <span className="max-w-[140px] truncate">{activeBranch?.name ?? 'All branches'}</span>
            <ChevronDownIcon size={14} className="text-ink-400" />
          </button>

          {branchOpen && (
            <div className="absolute right-0 mt-2 w-[240px] rounded-xl border border-ink-200 bg-white shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-ink-100 text-[10.5px] font-bold uppercase tracking-wider text-ink-400">
                Switch branch
              </div>
              <div className="max-h-[320px] overflow-y-auto py-1">
                <button
                  onClick={() => selectBranch(null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-ink-50"
                >
                  <BranchIcon size={13} className="text-ink-400 shrink-0" />
                  <span className="flex-1 text-[12.5px] font-semibold text-ink-800">All branches</span>
                  {!activeBranch && <CheckCircleIcon size={15} className="text-brand-600 shrink-0" />}
                </button>
                {branches.length === 0 ? (
                  <p className="px-3 py-3 text-[12px] text-ink-400">No branches yet.</p>
                ) : (
                  branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => selectBranch(b)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-ink-50"
                    >
                      <BranchIcon size={13} className="text-ink-400 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12.5px] font-semibold text-ink-800 truncate">{b.name}</span>
                        {b.isHeadOffice && <span className="text-[10px] text-ink-400">Head office</span>}
                      </span>
                      {activeBranch?.id === b.id && <CheckCircleIcon size={15} className="text-brand-600 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
              <Link
                href="/dashboard/administration/branches"
                onClick={() => setBranchOpen(false)}
                className="block px-3 py-2.5 border-t border-ink-100 text-[12px] font-semibold text-brand-600 hover:bg-ink-50"
              >
                Manage branches →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
