import styles from './ImagePlaceholder.module.css'

interface ImagePlaceholderProps {
  label: string
  className?: string
}

/** Hatched stand-in for an exercise photo. Override --ph-hatch / --ph-fill / --ph-ink on dark grounds. */
export function ImagePlaceholder({ label, className }: ImagePlaceholderProps) {
  return (
    <div role="img" aria-label={label} className={`${styles.placeholder} ${className ?? ''}`}>
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
