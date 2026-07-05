'use client'

import { useEffect, useState } from 'react'
import type { Branch } from './hr-api'
import { storage } from './storage'

/**
 * Reads the header's active-branch selection and re-renders whenever it
 * changes (the TopBar dispatches `covyvo:branch-changed`). List pages use the
 * returned `branchId` to scope their queries; `null` means "All branches"
 * (no filter). Also re-syncs across tabs via the storage event.
 */
export function useActiveBranch(): { branch: Branch | null; branchId: string | undefined } {
  const [branch, setBranch] = useState<Branch | null>(null)

  useEffect(() => {
    setBranch(storage.getActiveBranch<Branch>())

    function onChange(e: Event) {
      const detail = (e as CustomEvent).detail as Branch | null
      setBranch(detail ?? null)
    }
    function onStorage() {
      setBranch(storage.getActiveBranch<Branch>())
    }
    window.addEventListener('covyvo:branch-changed', onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('covyvo:branch-changed', onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return { branch, branchId: branch?.id }
}
