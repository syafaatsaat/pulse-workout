import type { CSSProperties } from 'react'

interface RingsProps {
  /** Circle radii in px, innermost first. The SVG is sized to fit the largest. */
  radii: number[]
  /** Stroke opacity of the first ring. */
  startOpacity: number
  /** Opacity lost per ring outward. */
  step: number
  /** Stroke colour, a CSS variable, e.g. "var(--ring)". */
  color: string
  /** Box size in px; defaults to the outermost diameter + 20. */
  size?: number
  className?: string
  /** Position it here (or via className); it is always absolutely positioned. */
  style?: CSSProperties
}

/**
 * Pulse's only decoration: thin concentric circles fading outward (REDESIGN.md §3).
 * Decorative, so hidden from assistive tech and never in the way of a click.
 */
export function Rings({ radii, startOpacity, step, color, size, className, style }: RingsProps) {
  const box = size ?? Math.ceil(Math.max(...radii) * 2 + 20)
  const c = box / 2
  return (
    <svg
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden="true"
      className={className}
      // max-width: none overrides base.css's svg { max-width: 100% }; rings overhang on purpose.
      style={{ position: 'absolute', maxWidth: 'none', pointerEvents: 'none', color, ...style }}
    >
      {radii.map((r, i) => (
        <circle
          key={r}
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={Math.max(0, startOpacity - i * step)}
        />
      ))}
    </svg>
  )
}
