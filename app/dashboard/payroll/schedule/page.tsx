'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { ApiError } from '../../../../src/lib/api'
import {
  PayrollCadence,
  PayrollSchedule,
  payrollCadenceLabel,
  payrollScheduleApi,
} from '../../../../src/lib/payroll-api'

const CADENCES: PayrollCadence[] = ['monthly', 'semimonthly', 'biweekly', 'weekly']

export default function PayrollSchedulePage() {
  const router = useRouter()
  const [sched, setSched] = useState<PayrollSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setSched(await payrollScheduleApi.get())
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function set<K extends keyof PayrollSchedule>(key: K, value: PayrollSchedule[K]) {
    setSched((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function save() {
    if (!sched) return
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      const updated = await payrollScheduleApi.upsert({
        enabled: sched.enabled,
        cadence: sched.cadence,
        payDay: sched.payDay,
        autoRun: sched.autoRun,
        autoApprove: sched.autoApprove,
        reminderLeadDays: sched.reminderLeadDays,
      })
      setSched(updated)
      setOk('Schedule saved.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the schedule')
    } finally {
      setSaving(false)
    }
  }

  async function runNow() {
    setRunning(true)
    setError(null)
    try {
      const run = await payrollScheduleApi.runNow({ approve: false })
      router.push(`/dashboard/payroll/runs/${run.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start a run')
      setRunning(false)
    }
  }

  if (loading || !sched) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Payroll schedule"
        description="Automate when payroll runs and get reminded to fund it."
        actions={<Button variant="secondary" loading={running} onClick={runNow}>Run payroll now</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      {ok && <div className="mb-4"><Alert variant="success">{ok}</Alert></div>}

      <div className="max-w-2xl space-y-4">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <ToggleRow
            label="Enable automatic payroll"
            hint="When on, Covyvo creates the run for you on each pay day."
            checked={sched.enabled}
            onChange={(v) => set('enabled', v)}
          />
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5 space-y-4">
          <Field label="Frequency">
            <select
              value={sched.cadence}
              onChange={(e) => set('cadence', e.target.value as PayrollCadence)}
              className={inputCls}
            >
              {CADENCES.map((c) => (
                <option key={c} value={c}>{payrollCadenceLabel[c]}</option>
              ))}
            </select>
          </Field>

          {(sched.cadence === 'monthly' || sched.cadence === 'semimonthly') && (
            <Field label="Pay day of month">
              <input
                type="number"
                min={1}
                max={31}
                value={sched.payDay}
                onChange={(e) => set('payDay', Math.max(1, Math.min(31, Number(e.target.value))))}
                className={inputCls}
              />
              <p className="mt-1 text-[11.5px] text-ink-500">Clamped to the last day for short months.</p>
            </Field>
          )}

          <Field label="Remind me to fund the wallet">
            <select
              value={sched.reminderLeadDays}
              onChange={(e) => set('reminderLeadDays', Number(e.target.value))}
              className={inputCls}
            >
              {[0, 1, 2, 3, 5, 7].map((d) => (
                <option key={d} value={d}>{d === 0 ? 'On pay day' : `${d} day${d > 1 ? 's' : ''} before`}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5 space-y-4">
          <ToggleRow
            label="Auto-create the run"
            hint="Creates and computes the payroll run automatically on the pay day."
            checked={sched.autoRun}
            onChange={(v) => set('autoRun', v)}
          />
          <ToggleRow
            label="Auto-approve after computing"
            hint="Skips manual review — the run is approved and ready to pay."
            checked={sched.autoApprove}
            onChange={(v) => set('autoApprove', v)}
            disabled={!sched.autoRun}
          />
        </div>

        {sched.nextPayDate && (
          <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4 text-[12.5px] text-ink-600">
            Next pay day: <b className="text-ink-900">{sched.nextPayDate}</b>
            {sched.lastRunDate && <> · Last run: {sched.lastRunDate}</>}
          </div>
        )}

        <div className="flex justify-end">
          <Button loading={saving} onClick={save}>Save schedule</Button>
        </div>
      </div>
    </>
  )
}

const inputCls =
  'w-full h-10 rounded-lg border border-ink-200 bg-white px-3 text-[13px] font-medium text-ink-900 focus:outline-none focus:border-brand-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-semibold text-ink-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <div className="text-[13px] font-semibold text-ink-900">{label}</div>
        <div className="text-[11.5px] text-ink-500 mt-0.5">{hint}</div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${checked ? 'bg-brand-600' : 'bg-ink-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
