import Image from 'next/image'
import logo from '../assets/logo/logo.png'

type Props = {
  className?: string
  /** `light` inverts the (dark navy) mark to white for use on dark backgrounds. */
  variant?: 'dark' | 'light'
  /** Rendered height in px; width scales to preserve aspect ratio. */
  height?: number
}

export function Logo({ className = '', variant = 'dark', height = 28 }: Props) {
  return (
    <Image
      src={logo}
      alt="Covyvo"
      priority
      height={height}
      width={Math.round(height * (logo.width / logo.height))}
      className={`${variant === 'light' ? 'brightness-0 invert' : ''} w-auto ${className}`}
      style={{ height }}
    />
  )
}
