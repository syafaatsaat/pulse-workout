import type { RefObject } from 'react'
import { formCue } from '../../data/formCues'
import type { Exercise } from '../../data/types'
import type { Best } from '../../engine/stats'
import { timer } from './format'
import styles from './InfoSheet.module.css'
import { CloseIcon, Kbd } from './parts'
import ground from './Player.module.css'
import { useModal } from './useModal'
import { useSwipeToClose } from './useSwipeToClose'

interface InfoSheetProps {
  open: boolean
  /** The move on screen: during a rest, the next one. */
  exercise?: Exercise
  best?: Best
  /** Rest colours (mist / navy) instead of the work sheet. */
  resting: boolean
  desktop: boolean
  /** Gets focus back when the sheet closes (the ⓘ button). */
  returnFocus: RefObject<HTMLElement | null>
  onClose: () => void
}

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)

/** "Beginner · No equipment" */
function meta(e: Exercise): string {
  return `${cap(e.level)} · ${e.equipment === 'body only' ? 'No equipment' : cap(e.equipment)}`
}

const bestText = (b: Best) => (b.measure === 'reps' ? `${b.value} reps` : timer(b.value * 1000))

/**
 * Exercise info (REDESIGN §4.2): bottom sheet on phones, 420px right panel on desktop. A native
 * modal <dialog>, so focus is trapped and Esc closes it; tapping the scrim closes it too. Opening
 * it doesn't pause the session: Pause is right there.
 */
export function InfoSheet({ open, exercise, best, resting, desktop, returnFocus, onClose }: InfoSheetProps) {
  const ref = useModal(open, returnFocus)
  // Phone sheet: the handle means "swipe down to close". (✕ and Esc close it for everyone else.)
  useSwipeToClose(ref, open && !desktop, onClose)
  const cue = formCue(exercise)
  return (
    <dialog
      ref={ref}
      className={`${ground.ground} ${styles.sheet}`}
      data-mode={resting ? 'rest' : 'work'}
      aria-labelledby="info-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // The dialog element itself only receives clicks outside the panel: the scrim.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {exercise && (
        <div className={styles.panel}>
          {!desktop && <span className={styles.handle} aria-hidden="true" />}
          <div className={styles.head}>
            <div className={styles.titles}>
              <span className={styles.meta}>{meta(exercise)}</span>
              <h2 id="info-title" className={styles.title}>
                {exercise.name}
              </h2>
            </div>
            <button
              type="button"
              className={styles.close}
              data-desktop={desktop || undefined}
              aria-label="Close exercise info"
              onClick={onClose}
            >
              <CloseIcon size={14} />
              {desktop && <Kbd className={styles.kbd}>Esc</Kbd>}
            </button>
          </div>

          {exercise.primaryMuscles.length > 0 && (
            <ul className={styles.chips} aria-label="Primary muscles">
              {exercise.primaryMuscles.map((m) => (
                <li key={m}>{cap(m)}</li>
              ))}
            </ul>
          )}

          {cue && (
            <div className={styles.cue}>
              <span className={styles.cueLabel}>Key cue</span>
              <span className={styles.cueText}>{cue}</span>
            </div>
          )}

          {exercise.instructions.length > 0 && (
            <>
              <h3 className={styles.howTitle}>How to do it</h3>
              <ol className={styles.steps}>
                {exercise.instructions.map((text, i) => (
                  <li key={i}>
                    <span className={styles.stepNo} aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {best && (
            <p className={styles.best}>
              <span className={styles.bestDot} aria-hidden="true" />
              Your best {bestText(best)}
            </p>
          )}
        </div>
      )}
    </dialog>
  )
}
