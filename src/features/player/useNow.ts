import { useEffect, useState } from 'react'

/**
 * Re-render on every animation frame while `active` and return the frame's Date.now(); frozen
 * otherwise. Only drives what is drawn: all timing comes from timestamps in the reducer state.
 */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    let frame = requestAnimationFrame(function loop() {
      setNow(Date.now())
      frame = requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(frame)
  }, [active])
  return now
}
