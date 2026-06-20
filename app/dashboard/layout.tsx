'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FloatingAiButton } from '../../src/components/FloatingAiButton'
import { Sidebar } from '../../src/components/Sidebar'
import { TopBar } from '../../src/components/TopBar'
import { ApiError } from '../../src/lib/api'
import { AuthTenant, AuthUser, authApi } from '../../src/lib/auth-api'
import { storage } from '../../src/lib/storage'
import { notifyUserUpdated } from '../../src/lib/usePermissions'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [me, setMe] = useState<AuthUser | null>(null)
  const [tenant, setTenant] = useState<AuthTenant | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = storage.getAccessToken()
    if (!token) {
      router.replace('/sign-in')
      return
    }
    setMe(storage.getActiveUser<AuthUser>())
    setTenant(storage.getActiveTenant<AuthTenant>())

    authApi
      .me()
      .then((fresh) => {
        setMe(fresh)
        storage.setActiveUser(fresh)
        notifyUserUpdated()
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          storage.clearAll()
          router.replace('/sign-in')
          return
        }
        setError(err instanceof ApiError ? err.message : 'Could not verify session')
      })
      .finally(() => setReady(true))
  }, [router])

  function handleSignOut() {
    storage.clearAll()
    router.replace('/sign-in')
  }

  if (!ready) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-ink-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    )
  }

  return (
    <div className="min-h-svh flex bg-ink-50">
      <Sidebar tenant={tenant} user={me} onSignOut={handleSignOut} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        {error && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-1.5 text-[12px] text-amber-800">
            {error}
          </div>
        )}
        <main className="flex-1 px-6 pb-8">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
      <FloatingAiButton />
    </div>
  )
}
