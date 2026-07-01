'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useState } from 'react'
import { Alert } from '../../../src/components/ui/Alert'
import { Button } from '../../../src/components/ui/Button'
import { PasswordField } from '../../../src/components/ui/PasswordField'
import { TextField } from '../../../src/components/ui/TextField'
import { MailIcon } from '../../../src/components/ui/icons'
import { ApiError } from '../../../src/lib/api'
import { authApi } from '../../../src/lib/auth-api'
import { storage } from '../../../src/lib/storage'
import { validateEmail } from '../../../src/lib/validation'

function safeReturnTo(raw: string | null | undefined): string {
  if (!raw) return '/dashboard'
  try {
    const decoded = decodeURIComponent(raw)
    // Only allow internal paths — block protocol-relative or absolute URLs.
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/dashboard'
    return decoded
  } catch {
    return '/dashboard'
  }
}

// useSearchParams bails out to CSR — Next.js requires the consumer to
// live inside a Suspense boundary so static export doesn't try to
// prerender the read.
function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = safeReturnTo(searchParams?.get('returnTo'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    const next: Record<string, string> = {}
    if (!validateEmail(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setLoading(true)
    try {
      const result = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      })

      if (result?.passwordChangeRequired && result?.setupToken) {
        storage.setSetupToken(result.setupToken)
        storage.setPendingEmail(email.trim().toLowerCase())
        router.push('/complete-invite')
        return
      }

      if (result?.selectionToken) {
        storage.setSelectionToken(result.selectionToken)
        storage.setSelectionTenants(result.tenants ?? [])
        router.push('/select-tenant')
        return
      }

      if (result?.accessToken) {
        storage.setAccessToken(result.accessToken)
        if (result.user) {
          storage.setActiveUser({
            ...result.user,
            permissions: result.permissions ?? result.user.permissions ?? [],
          })
        }
        if (result.tenant) storage.setActiveTenant(result.tenant)
        router.replace(returnTo)
        return
      }

      setFormError('Unexpected response from server')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {formError && <Alert variant="error">{formError}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          icon={<MailIcon />}
        />
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <div className="mt-2 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>
    </>
  )
}

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-[12.5px] text-ink-500">Sign in to your Covyvo workspace.</p>
      </div>

      <Suspense fallback={<SignInFallback />}>
        <SignInForm />
      </Suspense>

      <p className="text-[12.5px] text-ink-500 text-center">
        New to Covyvo?{' '}
        <Link href="/sign-up" className="text-brand-600 font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}

function SignInFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 rounded-xl bg-ink-100 animate-pulse" />
      <div className="h-12 rounded-xl bg-ink-100 animate-pulse" />
      <div className="h-10 rounded-lg bg-ink-100 animate-pulse" />
    </div>
  )
}
