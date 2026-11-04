import { useEffect, useState, type RefObject } from 'react'

export const FIRST_ROWS = 24
export const MORE_ROWS = 24

/**
 * How many rows of a long list to render: a screenful at once, then another chunk each time the
 * `sentinel` (an empty element after the list) comes within ~1.5 screens of view in `root` (the
 * scroll container; the viewport when null). Rows nobody scrolls to are never rendered, so a first
 * visit isn't spent building hundreds of them. `min` rows always render straight away (e.g. down
 * to the selected row); a new `key` (new filters) starts over.
 */
export function useProgressiveCount(
  total: number,
  min: number,
  key: string,
  sentinel: RefObject<Element | null>,
  root?: RefObject<Element | null>,
): number {
  const [state, setState] = useState({ key, count: FIRST_ROWS })
  let count = state.count
  if (state.key !== key) {
    count = FIRST_ROWS
    setState({ key, count })
  }
  const supported = typeof IntersectionObserver !== 'undefined'
  const shown = supported ? Math.min(total, Math.max(count, min)) : total

  useEffect(() => {
    const el = sentinel.current
    if (!supported || !el || shown >= total) return
    // A new observer per chunk: if the sentinel is still in range after rendering (a tall
    // screen), its first callback asks for the next chunk straight away.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting))
          setState((s) => (s.key === key ? { key, count: shown + MORE_ROWS } : s))
      },
      { root: root?.current ?? null, rootMargin: '0px 0px 1200px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [supported, shown, total, key, sentinel, root])

  return shown
}
