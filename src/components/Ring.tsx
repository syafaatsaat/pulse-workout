import styles from './Ring.module.css'

interface RingProps {
  value: number
  max: number
  /** Rendered size in px; geometry is drawn in a 40×40 box (4px stroke). */
  size?: number
}

const R = 16
const C = 2 * Math.PI * R

/** Weekly-goal progress ring: --line track, --accent arc. */
export function Ring({ value, max, size = 40 }: RingProps) {
  const frac = max > 0 ? Math.min(value / max, 1) : 0
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle className={styles.track} cx="20" cy="20" r={R} />
      {frac > 0 && (
        <circle
          className={styles.arc}
          cx="20"
          cy="20"
          r={R}
          strokeDasharray={`${C * frac} ${C}`}
          transform="rotate(-90 20 20)"
        />
      )}
    </svg>
  )
}
