import type { ReactNode } from 'react'
import styles from './Player.module.css'

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

export function Header({
  left,
  title,
  sub,
  right,
}: {
  left: ReactNode
  title: string
  sub: string
  right?: ReactNode
}) {
  return (
    <div className={styles.header}>
      {left}
      <div className={styles.headerText}>
        <span className={styles.headerTitle}>{title}</span>
        <span className={styles.headerSub}>{sub}</span>
      </div>
      {right ?? <span />}
    </div>
  )
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className={styles.pill}>
      <span className={styles.pillDot} />
      {children}
    </span>
  )
}
