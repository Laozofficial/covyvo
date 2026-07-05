'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Branch, branchesApi } from '../lib/hr-api'
import {
  Notification,
  notificationsApi,
  timeAgo,
} from '../lib/insights-api'
import { storage } from '../lib/storage'
import {
  BellIcon,
  BranchIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  SearchIcon,
} from './ui/icons'

export function TopBar() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null)
  const [branchOpen, setBranchOpen] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)

  const branchRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

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
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="search"
            placeholder="Search for anything..."
            className="w-full h-10 rounded-xl border border-ink-200 bg-white pl-9 pr-3 text-[12.5px] font-medium text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
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
