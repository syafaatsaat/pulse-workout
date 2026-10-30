import { useEffect, useRef } from 'react'

/** Drives a native <dialog> as a modal: focus trap, Esc and backdrop come from the browser. */
export function useModal(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return ref
}
