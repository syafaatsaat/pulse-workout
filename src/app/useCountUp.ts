import { useEffect, useState } from 'react'

const prefersMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches

/** Ease-out cubic: fast start, gentle landing. */
const easeOut = (t: number) => 1 - (1 - t) ** 3

/**
 * Counts from 0 up to `target` over `durationMs` (Summary celebration), starting when `enabled`
 * first turns true (e.g. once the data has loaded). Returns `target` as is when not enabled,
 * under reduced motion, or without matchMedia (tests).
 */
export function useCountUp(target: number, durationMs: number, enabled: boolean): number {
  const [motion] = useState(prefersMotion)
  const animate = enabled && motion
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!animate) return
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      setProgress(t)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [animate, durationMs])

  return !animate || progress >= 1 ? target : target * easeOut(progress)
}
