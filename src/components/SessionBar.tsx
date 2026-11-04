import type { Step } from '../engine/compile'
import styles from './SessionBar.module.css'
import { stepWeight } from './stepWeight'

interface SessionBarProps {
  steps: Step[]
  /** Index of the current step; steps before it render as done. */
  current: number
  label: string
  /**
   * player: past / future in currentColor, current in accent. preview (Today hero): the session's
   * shape in hero tints; work bright, rest faint.
   */
  variant?: 'player' | 'preview'
}

/**
 * One segment per step, width by stepWeight. Player variant: past ink 55%, current accent,
 * future ink 12% (ink = currentColor).
 */
export function SessionBar({ steps, current, label, variant = 'player' }: SessionBarProps) {
  return (
    <div className={styles.bar} data-variant={variant} role="img" aria-label={label}>
      {steps.map((step, i) => (
        <span
          key={i}
          className={styles.segment}
          data-state={i < current ? 'past' : i === current ? 'current' : 'future'}
          data-kind={step.phase === 'main' ? step.kind : step.phase}
          style={{ flexGrow: stepWeight(step) }}
        />
      ))}
    </div>
  )
}
