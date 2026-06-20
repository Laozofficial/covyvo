export function formatNaira(n: number, opts: { compact?: boolean } = {}) {
  if (opts.compact) {
    return '₦' + compact(n)
  }
  return '₦' + Math.round(n).toLocaleString('en-NG')
}

export function compact(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

export function formatNumber(n: number) {
  return n.toLocaleString('en-NG')
}
