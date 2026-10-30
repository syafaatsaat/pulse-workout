import { useEffect, useState } from 'react'

export type WakeLockStatus = 'off' | 'held' | 'unavailable'

/**
 * Keeps the screen on while `active`. The browser drops the lock whenever the page is hidden,
 * so it is requested again on every return to visible. 'unavailable' = unsupported or refused
 * (e.g. battery saver): the player shows a hint.
 */
export function useWakeLock(active: boolean): WakeLockStatus {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [held, setHeld] = useState<boolean | null>(null)

  useEffect(() => {
    if (!active || !supported) return
    let sentinel: WakeLockSentinel | null = null
    let disposed = false

    const request = async () => {
      if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (disposed) return void lock.release()
        sentinel = lock
        setHeld(true)
      } catch {
        setHeld(false)
      }
    }

    void request()
    const onVisibility = () => void request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel?.release()
    }
  }, [active, supported])

  if (!active) return 'off'
  if (!supported || held === false) return 'unavailable'
  return 'held'
}
