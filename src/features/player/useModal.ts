import { useEffect, useRef, type RefObject } from 'react'

/**
 * Drives a native <dialog> as a modal: focus trap, Esc and backdrop come from the browser.
 * `returnFocus` gets focus when it closes (otherwise the browser's own restore applies).
 */
export function useModal(open: boolean, returnFocus?: RefObject<HTMLElement | null>) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) {
      dialog.close()
      returnFocus?.current?.focus()
    }
  }, [open, returnFocus])
  return ref
}
