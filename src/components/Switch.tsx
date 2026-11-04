import styles from './Switch.module.css'

interface SwitchProps {
  /** id of the visible label text. */
  labelledBy: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** On / off switch (G-Settings): 48×28, ember when on. */
export function Switch({ labelledBy, checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  )
}
