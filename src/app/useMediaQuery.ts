import { useSyncExternalStore } from 'react'

// Missing in jsdom (and very old browsers): treat every query as not matching.
const supported = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (!supported()) return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => supported() && window.matchMedia(query).matches,
    () => false,
  )
}
