type Props = {
  points: number[]
  trend?: 'up' | 'down'
  width?: number
  height?: number
}

export function Sparkline({ points, trend = 'up', width = 80, height = 28 }: Props) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = width / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = i * stepX
    const y = height - ((p - min) / range) * (height - 4) - 2
    return [x, y] as const
  })
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`

  const stroke = trend === 'up' ? '#10b981' : '#ef4444'
  const fill = trend === 'up' ? '#10b98122' : '#ef444422'
  const gradientId = `spark-${trend}-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* tail dot */}
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r={2} fill={stroke} />
    </svg>
  )
}
