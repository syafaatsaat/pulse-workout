import { useEffect, useRef, type RefObject } from 'react'

/** Past this drag (px), or faster than this flick (px/ms), letting go closes the sheet. */
const CLOSE_DISTANCE = 120
const CLOSE_SPEED = 0.5

/** Whether a downward drag of `dy` px lasting `ms` should close the sheet. */
export function shouldClose(dy: number, ms: number): boolean {
  if (dy <= 0) return false
  return dy > CLOSE_DISTANCE || dy / Math.max(ms, 1) > CLOSE_SPEED
}

const reducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Swipe down to close a bottom sheet (the drag handle promises it). Starts only when the sheet is
 * scrolled to the top, so scrolling long instructions still works; the sheet follows the finger,
 * then closes or springs back. Native listeners, because React's touch handlers are passive and
 * this must preventDefault: that also stops the drag reaching the page as a pull-to-refresh.
 */
export function useSwipeToClose(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onClose: () => void,
): void {
  // The player re-renders many times a second with a new onClose each time; keeping it in a ref
  // means the listeners (and a drag in progress) survive those renders.
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  }, [onClose])

  useEffect(() => {
    const sheet = ref.current
    if (!sheet || !enabled) return
    let startY = 0
    let startTime = 0
    let dy = 0
    let armed = false
    let dragging = false

    const move = (y: number, animate: boolean) => {
      sheet.style.transition = animate && !reducedMotion() ? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)' : ''
      sheet.style.transform = y === 0 ? '' : `translateY(${y}px)`
    }

    const onStart = (e: TouchEvent) => {
      armed = e.touches.length === 1 && sheet.scrollTop <= 0
      dragging = false
      dy = 0
      startY = e.touches[0]?.clientY ?? 0
      startTime = e.timeStamp
    }

    const onMove = (e: TouchEvent) => {
      if (!armed) return
      const d = (e.touches[0]?.clientY ?? startY) - startY
      // The first movement decides: up is a scroll, down is a drag of the sheet.
      if (!dragging && d < 0) {
        armed = false
        return
      }
      dragging = true
      e.preventDefault()
      dy = Math.max(0, d)
      move(dy, false)
    }

    const onEnd = (e: TouchEvent) => {
      if (!dragging) return
      armed = dragging = false
      if (shouldClose(dy, e.timeStamp - startTime)) {
        if (reducedMotion()) {
          move(0, false)
          close.current()
          return
        }
        sheet.style.transition = 'transform 180ms ease-in'
        sheet.style.transform = 'translateY(100%)'
        window.setTimeout(() => {
          move(0, false)
          close.current()
        }, 180)
      } else {
        move(0, true)
      }
    }

    sheet.addEventListener('touchstart', onStart, { passive: true })
    sheet.addEventListener('touchmove', onMove, { passive: false })
    sheet.addEventListener('touchend', onEnd)
    sheet.addEventListener('touchcancel', onEnd)
    return () => {
      sheet.removeEventListener('touchstart', onStart)
      sheet.removeEventListener('touchmove', onMove)
      sheet.removeEventListener('touchend', onEnd)
      sheet.removeEventListener('touchcancel', onEnd)
      sheet.style.transition = ''
      sheet.style.transform = ''
    }
  }, [ref, enabled])
}
