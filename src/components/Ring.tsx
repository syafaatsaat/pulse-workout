import type { CSSProperties } from 'react'
import styles from './Ring.module.css'

interface RingProps {
  value: number
  max: number
  /** Rendered size in px. */
  size?: number
  /** Stroke width in px at the rendered size. */
  stroke?: number
  className?: string
  style?: CSSProperties
}

/**
 * Progress ring, arc from 12 o'clock. Colours come from --ring-track / --ring-arc
 * (defaults: --line / --accent, the weekly-goal ring). The rest ring overrides them.
 */
export function Ring({ value, max, size = 40, stroke = 4, className, style }: RingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const frac = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className={className}
      style={style}
    >
      <circle className={styles.track} cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
      {frac > 0 && (
        <circle
          className={styles.arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={`${c * frac} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  )
}
