import type { HTMLAttributes } from 'react'
import styles from './ImagePlaceholder.module.css'

interface ImagePlaceholderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Accessible name; leave empty when the placeholder is decorative (the text beside it names the move). */
  label: string
}

/** Flat stand-in for an exercise photo. Override --ph-fill / --ph-ink on dark grounds. */
export function ImagePlaceholder({ label, className, ...rest }: ImagePlaceholderProps) {
  return (
    <div
      {...rest}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={`${styles.placeholder} ${className ?? ''}`}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="17" cy="6" r="2" />
        <path d="M3 17h4l4-3 6 1M11 14l-1-5 5 1" />
      </svg>
    </div>
  )
}
