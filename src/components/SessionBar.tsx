import type { Step } from '../engine/compile'
import styles from './SessionBar.module.css'
import { stepWeight } from './stepWeight'

interface SessionBarProps {
  steps: Step[]
  /** Index of the current step; steps before it render as done. */
  current: number
  label: string
  /** Summary: done steps solid, the rest faint (no "current" segment). */
  variant?: 'player' | 'summary'
}

/**
 * Player variant: one segment per step, coloured from `currentColor` (work ink on orange,
 * white on blue). Past 55%, current solid, future 16%. The Today/Builder preview arrives on Day 5.
 */
export function SessionBar({ steps, current, label, variant = 'player' }: SessionBarProps) {
  return (
    <div className={styles.bar} data-variant={variant} role="img" aria-label={label}>
      {steps.map((step, i) => (
        <span
          key={i}
          className={styles.segment}
          data-state={i < current ? 'past' : i === current ? 'current' : 'future'}
          style={{ flexGrow: stepWeight(step) }}
        />
      ))}
    </div>
  )
}
