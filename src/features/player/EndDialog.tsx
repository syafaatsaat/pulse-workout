import styles from './Dialog.module.css'
import { useModal } from './useModal'

interface EndDialogProps {
  open: boolean
  setsDone: number
  onCancel: () => void
  onConfirm: () => void
}

export function EndDialog({ open, setsDone, onCancel, onConfirm }: EndDialogProps) {
  const ref = useModal(open)
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="end-title"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <h2 id="end-title" className={styles.title}>
        End session?
      </h2>
      <p className={styles.body}>
        {setsDone === 0
          ? 'No sets done yet, so nothing will be logged.'
          : `${setsDone} ${setsDone === 1 ? 'set is' : 'sets are'} saved and will appear in your log.`}
      </p>
      <div className={styles.buttons}>
        <button type="button" className={styles.secondary} onClick={onCancel} autoFocus>
          Keep going
        </button>
        <button type="button" className={styles.primary} onClick={onConfirm}>
          End session
        </button>
      </div>
    </dialog>
  )
}
