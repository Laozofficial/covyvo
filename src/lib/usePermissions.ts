'use client'

import { useEffect, useState } from 'react'
import { AuthUser } from './auth-api'
import { Permission } from './permissions'
import { storage } from './storage'

const STORAGE_EVENT = 'covyvo:user-updated'

/**
 * Fire this from any code that just wrote to storage.setActiveUser, so
 * usePermissions consumers update without a remount.
 */
export function notifyUserUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

/**
 * Reads the current user's permissions from local storage.
 * Refreshes when:
 *   - the component mounts
 *   - another tab updates the same localStorage key
 *   - notifyUserUpdated() is fired in this tab (e.g. after /auth/me lands)
 *
 *   const { has } = usePermissions()
 *   if (has('payroll:run')) { ... }
 */
export function usePermissions() {
  const [perms, setPerms] = useState<Set<string>>(() => new Set())
  const [role, setRole] = useState<string | undefined>(undefined)

  useEffect(() => {
    function read() {
      const u = storage.getActiveUser<AuthUser>()
      setPerms(new Set(u?.permissions ?? []))
      setRole(u?.role)
    }
    read()
    window.addEventListener('storage', read)
    window.addEventListener(STORAGE_EVENT, read)
    return () => {
      window.removeEventListener('storage', read)
      window.removeEventListener(STORAGE_EVENT, read)
    }
  }, [])

  // Owners always pass — matches the backend's PermissionsGuard short-circuit.
  const isOwner = role === 'owner'

  return {
    permissions: perms,
    role,
    isOwner,
    has: (p: Permission | string) => isOwner || perms.has(p),
    hasAny: (list: Array<Permission | string>) =>
      isOwner || list.some((p) => perms.has(p)),
    hasAll: (list: Array<Permission | string>) =>
      isOwner || list.every((p) => perms.has(p)),
  }
}
