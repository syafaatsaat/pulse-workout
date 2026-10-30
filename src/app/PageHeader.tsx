import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: string
}

export function PageHeader({ eyebrow, title }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="page-title">{title}</h1>
    </header>
  )
}
