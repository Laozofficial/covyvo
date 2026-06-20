'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useState } from 'react'
import { Alert } from '../../../src/components/ui/Alert'
import { Button } from '../../../src/components/ui/Button'
import { PasswordField } from '../../../src/components/ui/PasswordField'
import { ApiError } from '../../../src/lib/api'
import { authApi } from '../../../src/lib/auth-api'
import { storage } from '../../../src/lib/storage'
import {
  passwordHint,
  validatePassword,
} from '../../../src/lib/validation'

function CompleteInviteInner() {
  const router = useRouter()
  const params = useSearchParams()

  const [setupToken, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // If a fresh invite link was clicked, /complete-invite?email=user@x.com lands
  // the user here cold. They sign in first via /sign-in (which sets the setup
  // token) — but we can pre-fill the email hint if present in the URL.
  useEffect(() => {
    const token = storage.getSetupToken()
    if (!token) {
      const emailParam = params.get('email')
      if (emailParam) storage.setPendingEmail(emailParam)
      router.replace('/sign-in')
      return
    }
    setToken(token)
    setEmail(storage.getPendingEmail())
  }, [router, params])

  function validate() {
    const next: Record<string, string> = {}
    if (!validatePassword(password)) next.password = passwordHint
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!setupToken) return
    if (!validate()) return

    setLoading(true)
    try {
      const result = await authApi.completeInvite({
        setupToken,
        password,
        confirmPassword,
      })

      storage.clearSetupToken()

      if (result?.selectionToken) {
        storage.setSelectionToken(result.selectionToken)
        storage.setSelectionTenants(result.tenants ?? [])
        router.replace('/select-tenant')
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
        storage.clearPendingEmail()
        router.replace('/dashboard')
        return
      }

      setFormError('Unexpected response from server')
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Could not complete activation',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
          Activate your account
        </h1>
        <p className="text-[12.5px] text-ink-500">
          Welcome! Set a new password for{' '}
          <span className="font-semibold text-ink-800">{email ?? 'your account'}</span>
          {' '}to finish activating it.
        </p>
      </div>

      {formError && <Alert variant="error">{formError}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={!errors.password ? passwordHint : undefined}
        />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirmPassword}
        />

        <Button type="submit" fullWidth loading={loading}>
          Activate account
        </Button>
      </form>

      <p className="text-[12.5px] text-ink-500 text-center">
        Wrong account?{' '}
        <Link href="/sign-in" className="text-brand-600 font-semibold hover:underline">
          Sign in again
        </Link>
      </p>
    </div>
  )
}

export default function CompleteInvitePage() {
  return (
    <Suspense>
      <CompleteInviteInner />
    </Suspense>
  )
}
