import { useEffect, useState } from 'react'
import { useMediaQuery } from '../app/useMediaQuery'
import { ExercisePhoto } from './ExercisePhoto'
import styles from './ExerciseSlideshow.module.css'

interface ExerciseSlideshowProps {
  /** Frame paths under /exercises/ (start, end). */
  images: string[] | undefined
  /** Accessible name, e.g. "Pushups demonstration". */
  alt: string
  /** Stops on the current frame, e.g. while the session is paused. */
  still?: boolean
  /** Swap interval. */
  intervalMs?: number
  className?: string
}

/**
 * Shows how a move is done by alternating its start and end photos. With one photo, reduced motion
 * or `still`, it holds a single frame; with none, the hatched placeholder.
 */
export function ExerciseSlideshow({
  images = [],
  alt,
  still,
  intervalMs = 1000,
  className,
}: ExerciseSlideshowProps) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const frames = images.slice(0, 2)
  const animate = frames.length > 1 && !reduced && !still
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!animate) return
    // Only swaps a picture; nothing here measures time.
    const id = window.setInterval(() => setFrame((f) => (f + 1) % 2), intervalMs)
    return () => window.clearInterval(id)
  }, [animate, intervalMs])

  const shown = reduced ? 0 : frame % Math.max(1, frames.length)

  return (
    <div className={`${styles.slideshow} ${className ?? ''}`} role="img" aria-label={alt}>
      {frames.length === 0 ? (
        <ExercisePhoto path={undefined} alt="" className={styles.frame} />
      ) : (
        frames.map((path, i) => (
          <ExercisePhoto
            key={path}
            path={path}
            alt=""
            className={styles.frame}
            data-shown={i === shown || undefined}
            aria-hidden="true"
            fallback={i === 0 ? 'placeholder' : 'none'}
            draggable={false}
          />
        ))
      )}
    </div>
  )
}
