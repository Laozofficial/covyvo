'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { storage } from '../src/lib/storage'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = storage.getAccessToken()
    router.replace(token ? '/dashboard' : '/sign-in')
  }, [router])

  return (
    <div className="min-h-svh flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
    </div>
  )
}
