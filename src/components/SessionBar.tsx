import type { Step } from '../engine/compile'
import styles from './SessionBar.module.css'

/** Segment weights from DESIGN_SYSTEM.md: work 3, rest 1, warm-up 4, cool-down 3. */
function stepWeight(step: Step): number {
  if (step.phase === 'warmup') return 4
  if (step.phase === 'cooldown') return 3
  return step.kind === 'rest' ? 1 : 3
}

interface SessionBarProps {
  steps: Step[]
  /** Index of the current step; steps before it render as done. */
  current: number
  label: string
}

/**
 * Player variant: one segment per step, coloured from `currentColor` (work ink on orange,
 * white on blue). Past 55%, current solid, future 16%. The Today/Builder preview arrives on Day 5.
 */
export function SessionBar({ steps, current, label }: SessionBarProps) {
  return (
    <div className={styles.bar} role="img" aria-label={label}>
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
