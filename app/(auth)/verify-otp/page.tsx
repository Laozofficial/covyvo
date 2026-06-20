'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useRef, useState } from 'react'
import { Alert } from '../../../src/components/ui/Alert'
import { Button } from '../../../src/components/ui/Button'
import { REGISTRATION_STEPS, Stepper } from '../../../src/components/ui/Stepper'
import { ApiError } from '../../../src/lib/api'
import { authApi } from '../../../src/lib/auth-api'
import { storage } from '../../../src/lib/storage'

function VerifyOtpInner() {
  const router = useRouter()
  const params = useSearchParams()
  const flow = params.get('flow') === 'reset' ? 'reset' : 'registration'

  const [email, setEmail] = useState<string | null>(null)
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendOk, setResendOk] = useState(false)

  useEffect(() => {
    setEmail(storage.getPendingEmail())
    refs.current[0]?.focus()
  }, [])

  function setAt(idx: number, value: string) {
    const v = value.replace(/\D/g, '').slice(0, 1)
    setDigits((prev) => {
      const next = [...prev]
      next[idx] = v
      return next
    })
    if (v && idx < 5) refs.current[idx + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const next = Array(6).fill('')
    pasted.split('').forEach((c, i) => (next[i] = c))
    setDigits(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email) {
      setError('Email is missing. Please restart the flow.')
      return
    }
    const otp = digits.join('')
    if (otp.length !== 6) {
      setError('Enter the 6-digit code')
      return
    }
    setLoading(true)
    try {
      if (flow === 'registration') {
        const result = await authApi.verifyRegistrationOtp({ email, otp })
        if (result?.registrationToken) storage.setRegistrationToken(result.registrationToken)
        router.push('/onboarding')
      } else {
        const result = await authApi.verifyPasswordResetOtp({ email, otp })
        if (result?.resetToken) storage.setResetToken(result.resetToken)
        router.push('/reset-password')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email || flow !== 'reset') return
    setResending(true)
    setResendOk(false)
    setError(null)
    try {
      await authApi.startPasswordReset({ email })
      setResendOk(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      {flow === 'registration' && <Stepper steps={REGISTRATION_STEPS} current={1} />}

      <div className="space-y-1.5">
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
          Verify your email
        </h1>
        <p className="text-[12.5px] text-ink-500">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-ink-800">{email ?? '...'}</span>
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {resendOk && <Alert variant="success">A new code has been sent.</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2 justify-between" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-11 text-center text-lg font-semibold rounded-xl border border-ink-200 bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          ))}
        </div>

        <Button type="submit" fullWidth loading={loading}>
          Verify
        </Button>
      </form>

      <div className="text-[12.5px] text-ink-500 text-center">
        Didn't get the code?{' '}
        {flow === 'reset' ? (
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="text-brand-600 font-semibold hover:underline disabled:opacity-50"
          >
            {resending ? 'Resending…' : 'Resend'}
          </button>
        ) : (
          <span className="text-ink-400">Check your spam folder.</span>
        )}
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpInner />
    </Suspense>
  )
}
