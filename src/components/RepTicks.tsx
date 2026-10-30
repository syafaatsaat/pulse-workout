import styles from './RepTicks.module.css'

interface RepTicksProps {
  /** Reps logged so far (filled squares). */
  value: number
  target: number
  /** Last time's best: a ring marks that square. */
  best?: number
}

const MAX_TICKS = 20

/** One square per rep of the target (more if the count goes over); colours from currentColor. */
export function RepTicks({ value, target, best }: RepTicksProps) {
  const count = Math.min(Math.max(target, value, best ?? 0), MAX_TICKS)
  return (
    <div
      className={styles.ticks}
      role="img"
      aria-label={`${value} of ${target} reps${best ? `, last best ${best}` : ''}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={styles.tick}
          data-filled={i < value}
          data-best={best === i + 1 || undefined}
        />
      ))}
    </div>
  )
}
