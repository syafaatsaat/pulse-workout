import { useEffect, useState } from 'react'

export const FIRST_ROWS = 24
export const MORE_ROWS = 60

const whenIdle = (fn: () => void): (() => void) => {
  // Safari has no requestIdleCallback.
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: 500 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 16)
  return () => clearTimeout(id)
}

/**
 * How many rows of a long list to render: a screenful at once, the rest a chunk at a time while
 * the browser is idle, so the first paint isn't blocked by hundreds of rows. `min` rows always
 * render straight away (e.g. down to the selected row); a new `key` (new filters) starts over.
 */
export function useProgressiveCount(total: number, min: number, key: string): number {
  const [state, setState] = useState({ key, count: FIRST_ROWS })
  let count = state.count
  if (state.key !== key) {
    count = FIRST_ROWS
    setState({ key, count })
  }
  const shown = Math.min(total, Math.max(count, min))

  useEffect(() => {
    if (shown >= total) return
    return whenIdle(() => setState((s) => (s.key === key ? { key, count: shown + MORE_ROWS } : s)))
  }, [shown, total, key])

  return shown
}
