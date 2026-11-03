import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  /** Muted sentence-case line above the title, e.g. "Saved on this device". */
  kicker?: ReactNode
  title: string
}

export function PageHeader({ kicker, title }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {kicker && <span className={styles.kicker}>{kicker}</span>}
      <h1 className="page-title">{title}</h1>
    </header>
  )
}
