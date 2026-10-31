import { ExercisePhoto } from '../../components/ExercisePhoto'
import type { Exercise } from '../../data/types'
import styles from './Dialog.module.css'
import { useModal } from './useModal'

interface FormDialogProps {
  open: boolean
  exercise?: Exercise
  onClose: () => void
}

/** Form check without leaving the player: start / end photos and the steps. */
export function FormDialog({ open, exercise, onClose }: FormDialogProps) {
  const ref = useModal(open)
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${styles.form}`}
      aria-labelledby="form-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      {exercise && (
        <>
          <h2 id="form-title" className={styles.title}>
            {exercise.name}
          </h2>
          <div className={styles.photos}>
            {['Start', 'End'].map((label, i) => {
              const src = exercise.images[i]
              return (
                <figure key={label} className={styles.photo}>
                  <ExercisePhoto
                    path={src}
                    alt={`${exercise.name}: ${label.toLowerCase()} position`}
                    placeholderLabel={`No photo: ${label.toLowerCase()} position`}
                    placeholderClassName={styles.placeholder}
                    width={600}
                    height={400}
                  />
                  <figcaption className="eyebrow">{label}</figcaption>
                </figure>
              )
            })}
          </div>
          <ol className={styles.steps}>
            {exercise.instructions.map((text, i) => (
              <li key={i}>
                <span className={styles.stepNo}>{String(i + 1).padStart(2, '0')}</span>
                {text}
              </li>
            ))}
          </ol>
        </>
      )}
      <div className={styles.buttons}>
        <button type="button" className={styles.primary} onClick={onClose} autoFocus>
          Back to set
        </button>
      </div>
    </dialog>
  )
}
