'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert } from '../../../src/components/ui/Alert'
import { Button } from '../../../src/components/ui/Button'
import { BuildingIcon } from '../../../src/components/ui/icons'
import { ApiError } from '../../../src/lib/api'
import { authApi, TenantMembership } from '../../../src/lib/auth-api'
import { storage } from '../../../src/lib/storage'

export default function SelectTenantPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantMembership[]>([])
  const [selectionToken, setToken] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = storage.getSelectionToken()
    if (!token) {
      router.replace('/sign-in')
      return
    }
    setToken(token)
    setTenants(storage.getSelectionTenants<TenantMembership>())
  }, [router])

  async function handleSelect() {
    if (!selectionToken || !selected) return
    setError(null)
    setLoading(true)
    try {
      const result = await authApi.selectTenant({
        selectionToken,
        tenantId: selected,
      })
      if (result?.accessToken) {
        storage.setAccessToken(result.accessToken)
        if (result.user) {
          storage.setActiveUser({
            ...result.user,
            permissions: result.permissions ?? result.user.permissions ?? [],
          })
        }
        if (result.tenant) storage.setActiveTenant(result.tenant)
        storage.clearSelectionToken()
        storage.clearSelectionTenants()
        router.replace('/dashboard')
      } else {
        setError('Unexpected response from server')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not select tenant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
          Choose a workspace
        </h1>
        <p className="text-[12.5px] text-ink-500">
          You belong to multiple organisations. Pick one to continue.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-2">
        {tenants.length === 0 ? (
          <p className="text-[12.5px] text-ink-500">
            No workspaces found.{' '}
            <button
              type="button"
              onClick={() => router.replace('/sign-in')}
              className="text-brand-600 font-semibold hover:underline"
            >
              Sign in again
            </button>
            .
          </p>
        ) : (
          tenants.map((t) => {
            const isSelected = selected === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={[
                  'group w-full flex items-center gap-3 text-left rounded-xl border px-3.5 py-3 transition',
                  isSelected
                    ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                    : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
                    isSelected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
                  ].join(' ')}
                >
                  <BuildingIcon size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink-900 truncate">
                    {t.name}
                  </p>
                  <p className="text-[11.5px] text-ink-500 truncate">
                    {[t.slug, t.baseCurrency, t.role].filter(Boolean).join(' • ')}
                  </p>
                </span>
                <span
                  className={[
                    'h-4 w-4 rounded-full border-2 shrink-0 transition',
                    isSelected
                      ? 'border-brand-600 bg-brand-600'
                      : 'border-ink-300 group-hover:border-ink-400',
                  ].join(' ')}
                >
                  {isSelected && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-white m-auto mt-[3px]" />
                  )}
                </span>
              </button>
            )
          })
        )}
      </div>

      <Button fullWidth onClick={handleSelect} loading={loading} disabled={!selected}>
        Continue
      </Button>
    </div>
  )
}
