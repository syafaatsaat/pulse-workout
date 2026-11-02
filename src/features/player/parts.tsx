import { useState, type ReactNode } from 'react'
import styles from './Player.module.css'
import progress from './Progress.module.css'

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.round} aria-label="End session" onClick={onClick}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </button>
  )
}

/** Round pause / resume toggle, left of the primary action on both the work and rest screens. */
export function PauseButton({ paused, onClick }: { paused: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.secondary}
      aria-label={paused ? 'Resume' : 'Pause'}
      onClick={onClick}
    >
      {paused ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
      ) : (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="9" y1="6" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="18" />
        </svg>
      )}
    </button>
  )
}

/** − / + beside the counter: one rep, or −15 / +15 on a rest or a hold. */
export function AdjustButton({
  adjust,
  sign,
  className,
  onClick,
}: {
  adjust: 'reps' | 'time'
  sign: -1 | 1
  className?: string
  onClick: () => void
}) {
  const reps = adjust === 'reps'
  return (
    <button
      type="button"
      className={className}
      data-adjust={adjust}
      aria-label={
        reps
          ? sign < 0
            ? 'One rep fewer'
            : 'One rep more'
          : sign < 0
            ? '15 seconds less'
            : '15 seconds more'
      }
      aria-keyshortcuts={sign < 0 ? 'ArrowLeft' : 'ArrowRight'}
      onClick={onClick}
    >
      {reps ? (sign < 0 ? '−' : '+') : sign < 0 ? '−15' : '+15'}
    </button>
  )
}

/** Bar under the counter: fill 0–1, and a tick at last time's mark. */
export function Progress({ fill, marker, className }: { fill: number; marker?: number; className?: string }) {
  return (
    <div className={`${progress.track} ${className ?? ''}`} aria-hidden="true">
      <span className={progress.fill} style={{ width: `${fill * 100}%` }} />
      {marker !== undefined && <span className={progress.marker} style={{ left: `${marker * 100}%` }} />}
    </div>
  )
}

export function Header({ left, title }: { left: ReactNode; title: string }) {
  return (
    <div className={styles.header}>
      {left}
      <span className={styles.headerTitle}>{title}</span>
      <span />
    </div>
  )
}

/**
 * Work ⇄ rest: a layer in the previous mode's colour that drops away to the top, so the new colour
 * rises from the bottom (where Set done / Skip rest sit). Nothing on first render. Hidden by CSS under
 * reduced motion.
 */
export function Sweep({ mode, className }: { mode: 'work' | 'rest'; className?: string }) {
  const [sweep, setSweep] = useState<{ mode: string; from?: string; n: number }>({ mode, n: 0 })
  // Derived from the previous render (React's "storing information from previous renders" pattern).
  if (mode !== sweep.mode) setSweep({ mode, from: sweep.mode, n: sweep.n + 1 })
  return sweep.from ? (
    <span key={sweep.n} className={className} data-from={sweep.from} aria-hidden="true" />
  ) : null
}
