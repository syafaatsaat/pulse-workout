import { useState, type ImgHTMLAttributes } from 'react'
import { ImagePlaceholder } from './ImagePlaceholder'

interface ExercisePhotoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /** Path under /exercises/, e.g. "Pushups/0.webp". Missing → placeholder. */
  path: string | undefined
  alt: string
  /** Placeholder's accessible name; defaults to `alt`. */
  placeholderLabel?: string
  /** Class for the placeholder when it differs from the image's. */
  placeholderClassName?: string
  /** 'none' renders nothing when the photo is missing or fails (e.g. an optional second frame). */
  fallback?: 'placeholder' | 'none'
}

/** An exercise photo that falls back to the placeholder when it's missing or fails to load. */
export function ExercisePhoto({
  path,
  alt,
  placeholderLabel,
  placeholderClassName,
  fallback = 'placeholder',
  className,
  ...img
}: ExercisePhotoProps) {
  const [failed, setFailed] = useState<string>()
  if (!path || failed === path) {
    if (fallback === 'none') return null
    // Keep data-* / aria-hidden so CSS state (e.g. which frame is shown) still applies.
    const keep = Object.fromEntries(
      Object.entries(img).filter(([k]) => k.startsWith('data-') || k === 'aria-hidden'),
    )
    return (
      <ImagePlaceholder
        {...keep}
        className={placeholderClassName ?? className}
        label={placeholderLabel ?? alt}
      />
    )
  }
  return (
    <img
      {...img}
      className={className}
      src={`/exercises/${path}`}
      alt={alt}
      onError={() => setFailed(path)}
    />
  )
}
