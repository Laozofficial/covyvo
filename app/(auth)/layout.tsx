import { Logo } from '../../src/components/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center px-4 py-10 overflow-hidden bg-gradient-to-br from-ink-50 via-white to-ink-50">
      {/* Ambient brand gradients */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--color-brand-400), transparent 65%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-40 h-[560px] w-[560px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--color-brand-600), transparent 65%)',
        }}
      />
      {/* Faint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-7">
          <Logo />
        </div>

        <div
          className="rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 p-7 sm:p-9 ring-1 ring-ink-200/40"
          style={{
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.6) inset, 0 24px 60px -20px rgba(15,23,42,0.18), 0 12px 32px -16px rgba(15,23,42,0.12), 0 4px 12px -4px rgba(15,23,42,0.06)',
          }}
        >
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} Covyvo by Nexoris Technologies
        </p>
      </div>
    </div>
  )
}
