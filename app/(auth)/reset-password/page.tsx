'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../src/components/ui/Alert'
import { Button } from '../../../src/components/ui/Button'
import { PasswordField } from '../../../src/components/ui/PasswordField'
import { ApiError } from '../../../src/lib/api'
import { authApi } from '../../../src/lib/auth-api'
import { storage } from '../../../src/lib/storage'
import { passwordHint, validatePassword } from '../../../src/lib/validation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [resetToken, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = storage.getResetToken()
    if (!token) {
      router.replace('/forgot-password')
      return
    }
    setToken(token)
  }, [router])

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
    if (!resetToken) return
    if (!validate()) return
    setLoading(true)
    try {
      await authApi.completePasswordReset({
        resetToken,
        password,
        confirmPassword,
      })
      storage.clearResetToken()
      storage.clearPendingEmail()
      router.replace('/sign-in')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
          Set a new password
        </h1>
        <p className="text-[12.5px] text-ink-500">
          Choose a strong password you haven't used before.
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
          Reset password
        </Button>
      </form>
    </div>
  )
}
