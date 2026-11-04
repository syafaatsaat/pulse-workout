import styles from './Stepper.module.css'

interface StepperProps {
  /** Names the value for screen readers, e.g. "Default rest". */
  label: string
  value: number
  min: number
  max: number
  step?: number
  /** Visible value, e.g. 30 → "0:30". */
  format?: (value: number) => string
  onChange: (value: number) => void
}

/** − value + with round buttons (G-Settings). Buttons stop at min / max. */
export function Stepper({ label, value, min, max, step = 1, format = String, onChange }: StepperProps) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <output aria-live="polite">{format(value)}</output>
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        +
      </button>
    </div>
  )
}
