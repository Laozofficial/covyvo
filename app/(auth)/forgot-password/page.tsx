'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Alert } from '../../../src/components/ui/Alert'
import { Button } from '../../../src/components/ui/Button'
import { TextField } from '../../../src/components/ui/TextField'
import { MailIcon } from '../../../src/components/ui/icons'
import { ApiError } from '../../../src/lib/api'
import { authApi } from '../../../src/lib/auth-api'
import { storage } from '../../../src/lib/storage'
import { validateEmail } from '../../../src/lib/validation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEmailError(undefined)
    if (!validateEmail(email)) {
      setEmailError('Enter a valid email address')
      return
    }
    setLoading(true)
    try {
      await authApi.startPasswordReset({ email: email.trim().toLowerCase() })
      storage.setPendingEmail(email.trim().toLowerCase())
      router.push('/verify-otp?flow=reset')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
          Reset your password
        </h1>
        <p className="text-[12.5px] text-ink-500">
          Enter your email and we'll send a 6-digit code to reset it.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          icon={<MailIcon />}
        />
        <Button type="submit" fullWidth loading={loading}>
          Send code
        </Button>
      </form>

      <p className="text-[12.5px] text-ink-500 text-center">
        Remembered it?{' '}
        <Link href="/sign-in" className="text-brand-600 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
