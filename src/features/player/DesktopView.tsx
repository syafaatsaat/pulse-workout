import type { Dispatch, ReactNode } from 'react'
import { ExerciseSlideshow } from '../../components/ExerciseSlideshow'
import { SessionBar } from '../../components/SessionBar'
import { stepWeight } from '../../components/stepWeight'
import type { Exercise } from '../../data/types'
import type { Step } from '../../engine/compile'
import { leadInMs, remainingMs, type PlayerAction, type PlayerState } from '../../engine/playerReducer'
import type { SetValue } from '../../engine/stats'
import styles from './Desktop.module.css'
import { seconds, timer } from './format'
import { upNext } from './upNext'

interface DesktopViewProps {
  state: PlayerState
  step: Step
  now: number
  moveCount: number
  workoutName: string
  blocks: { blockId: string; label: string }[]
  exercises: Map<string, Exercise>
  lastTimes: Map<string, SetValue>
  dispatch: Dispatch<PlayerAction>
  onEnd: () => void
  notice?: string
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>
}

function lastLabel(last: SetValue | undefined): string {
  if (!last) return '—'
  return last.reps !== undefined ? `${last.reps} reps` : seconds(last.seconds ?? 0)
}

/**
 * Full-screen desktop player (DT-Player). Everything sits on one 4-column grid: name + counter |
 * slideshow; last time | the next three steps; pause | primary action.
 */
export function DesktopView(props: DesktopViewProps) {
  const { state, step, now, workoutName, blocks, exercises, lastTimes, dispatch, onEnd, notice } = props
  const resting = step.kind === 'rest'
  const paused = state.status === 'paused'
  const remaining = remainingMs(state, now) ?? 0
  const leadIn = leadInMs(state, now)
  const isReps = !resting && step.mode === 'reps'
  const nextWork = state.steps.slice(state.index + 1).find((s) => s.kind === 'work')
  // The move on screen: the current one, or during a rest the one coming up.
  const shown = resting ? nextWork : step
  const shownExercise = shown && exercises.get(shown.exerciseId)
  const shownName = shown ? (shownExercise?.name ?? shown.exerciseId) : 'Finish'
  const last = shown && lastTimes.get(shown.exerciseId)
  const set = `Set ${step.setIndex + 1} of ${step.setCount}`
  const position = `${workoutName} · ${set}${resting ? ' done' : ''}`
  const bigNum = isReps ? String(state.reps).padStart(2, '0') : timer(leadIn > 0 ? leadIn : remaining)
  // During a rest the move on screen is already the next one, so the cards start after it.
  const later = upNext(state.steps, state.index, exercises, resting ? 4 : 3).slice(resting ? 1 : 0)

  // Block labels sit under their share of the bar.
  const blockWeights = blocks.map(({ blockId, label }) => ({
    label,
    weight: state.steps.filter((s) => s.blockId === blockId).reduce((w, s) => w + stepWeight(s), 0),
  }))

  const primaryLabel = paused ? 'Resume' : resting ? 'Skip rest' : leadIn > 0 ? 'Start now' : 'Set done'

  return (
    <div className={styles.desk} data-mode={resting ? 'rest' : 'work'}>
      <header className={styles.header}>
        <div className={styles.top}>
          <button type="button" className={styles.chip} onClick={onEnd}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
            End session <Kbd>Esc</Kbd>
          </button>
          <span className={styles.position}>{position}</span>
        </div>
        <SessionBar steps={state.steps} current={state.index} label={`Session progress: ${position}`} />
        <div className={styles.blocks} aria-hidden="true">
          {blockWeights.map(({ label, weight }) => (
            <span key={label} style={{ flexGrow: weight }}>
              {label}
            </span>
          ))}
        </div>
        {notice && <p className={styles.notice}>{notice}</p>}
      </header>

      <main className={styles.main}>
        <section className={styles.stage}>
          <h1 className={styles.name}>
            {resting && <span className="visually-hidden">Rest. Next: </span>}
            {shownName}
          </h1>
          <div className={styles.count}>
            {leadIn > 0 && <span className={styles.pill}>Get into position</span>}
            <div className={styles.counterRow}>
              <span
                className={styles.counter}
                role={isReps ? undefined : 'timer'}
                aria-label={isReps ? `${state.reps} reps` : undefined}
              >
                {bigNum}
              </span>
              {isReps && (
                <div className={styles.adjust}>
                  <button
                    type="button"
                    aria-label="One rep fewer"
                    aria-keyshortcuts="ArrowLeft"
                    title="One rep fewer (←)"
                    onClick={() => dispatch({ type: 'adjustReps', delta: -1 })}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label="One rep more"
                    aria-keyshortcuts="ArrowRight"
                    title="One rep more (→)"
                    onClick={() => dispatch({ type: 'adjustReps', delta: 1 })}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className={styles.media}>
          <ExerciseSlideshow
            className={styles.slideshow}
            images={shownExercise?.images}
            alt={`${shownName} demonstration`}
            still={paused}
          />
          <span className={styles.mediaTag} aria-hidden="true">
            {resting ? 'Next' : 'Form'}
          </span>
        </div>

        <dl className={styles.cards}>
          <div className={styles.card}>
            <dt>Last time</dt>
            <dd className={styles.cardValue}>{lastLabel(last)}</dd>
          </div>
          {[0, 1, 2].map((i) => {
            const row = later[i]
            const finish = !row && i === later.length
            if (!row && !finish) return null
            return (
              <div key={i} className={styles.card}>
                <dt>{i === 0 ? 'Up next' : 'Then'}</dt>
                <dd className={styles.cardValue}>{row ? row.name : 'Finish'}</dd>
                {row && <dd className={styles.cardDose}>{row.dose}</dd>}
              </div>
            )
          })}
        </dl>
      </main>

      <footer className={styles.footer}>
        <div className={styles.secondaryActions}>
          <button
            type="button"
            className={styles.pause}
            onClick={() => dispatch({ type: paused ? 'resume' : 'pause', now: Date.now() })}
          >
            {paused ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="9" y1="6" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="18" />
              </svg>
            )}
            {paused ? 'Resume' : 'Pause'} <Kbd>P</Kbd>
          </button>
          {resting && (
            <button
              type="button"
              className={styles.pause}
              aria-keyshortcuts="ArrowUp"
              onClick={() => dispatch({ type: 'addTime', ms: 15_000 })}
            >
              +15s <Kbd>↑</Kbd>
            </button>
          )}
        </div>
        <button
          type="button"
          className={styles.cta}
          onClick={() => {
            const now = Date.now()
            if (paused) dispatch({ type: 'resume', now })
            else if (resting) dispatch({ type: 'skipRest', now })
            else dispatch(leadIn > 0 ? { type: 'startNow', now } : { type: 'setDone', now })
          }}
        >
          {primaryLabel}
          <Kbd>Space</Kbd>
        </button>
      </footer>
    </div>
  )
}
