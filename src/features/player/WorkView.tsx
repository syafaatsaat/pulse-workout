import type { Dispatch } from 'react'
import { ExerciseSlideshow } from '../../components/ExerciseSlideshow'
import { SessionBar } from '../../components/SessionBar'
import type { Exercise } from '../../data/types'
import type { Step } from '../../engine/compile'
import { leadInMs, remainingMs, type PlayerAction, type PlayerState } from '../../engine/playerReducer'
import type { SetValue } from '../../engine/stats'
import { seconds, timer } from './format'
import { CloseButton, Header, PauseButton } from './parts'
import styles from './Player.module.css'

interface WorkViewProps {
  state: PlayerState
  step: Step
  now: number
  moveCount: number
  exercise?: Exercise
  next?: Step
  nextExercise?: Exercise
  last?: SetValue
  dispatch: Dispatch<PlayerAction>
  onEnd: () => void
  onForm: () => void
  /** One-line hint under the header, e.g. when the screen can't be kept awake. */
  notice?: string
}

function describe(last: SetValue): string {
  return last.reps !== undefined ? `${last.reps} reps` : seconds(last.seconds ?? 0)
}

function nextLabel(next: Step | undefined, nextExercise: Exercise | undefined): string {
  if (!next) return 'Finish'
  if (next.kind === 'rest') return `Rest ${seconds(next.target)}`
  return nextExercise?.name ?? next.exerciseId
}

export function WorkView({
  state,
  step,
  now,
  exercise,
  next,
  nextExercise,
  last,
  dispatch,
  onEnd,
  onForm,
  notice,
}: WorkViewProps) {
  const paused = state.status === 'paused'
  const name = exercise?.name ?? step.exerciseId
  const remaining = remainingMs(state, now) ?? 0
  const leadIn = leadInMs(state, now)
  const isReps = step.mode === 'reps'
  const position = `Set ${step.setIndex + 1} of ${step.setCount}`
  // Warm-up / cool-down run to the clock: "last time" says nothing there.
  const meta = [
    step.phase === 'main' && last && `Last time ${describe(last)}`,
    `Next ${nextLabel(next, nextExercise)}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={styles.player} data-mode="work">
      <div className={styles.inner}>
        <SessionBar
          steps={state.steps}
          current={state.index}
          label={`Session progress: move ${step.moveIndex + 1}, ${position.toLowerCase()}`}
        />
        <Header
          left={<CloseButton onClick={onEnd} />}
          title={position}
          right={
            <button type="button" className={styles.round} aria-label={`How to do ${name}`} onClick={onForm}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="11" x2="12" y2="16.5" />
                <circle cx="12" cy="7.6" r="0.6" fill="currentColor" />
              </svg>
            </button>
          }
        />
        {notice && <p className={styles.notice}>{notice}</p>}

        <ExerciseSlideshow
          className={styles.photo}
          images={exercise?.images}
          alt={`${name} demonstration`}
          still={paused}
        />

        <h1 className={styles.name} data-long={name.length > 14 || undefined}>
          {name}
        </h1>

        <div className={styles.stage}>
          {isReps ? (
            <div className={styles.repRow}>
              <button
                type="button"
                className={styles.repAdjust}
                aria-label="One rep fewer"
                onClick={() => dispatch({ type: 'adjustReps', delta: -1 })}
              >
                −
              </button>
              <span className={styles.counter} aria-label={`${state.reps} reps`}>
                {String(state.reps).padStart(2, '0')}
              </span>
              <button
                type="button"
                className={styles.repAdjust}
                aria-label="One rep more"
                onClick={() => dispatch({ type: 'adjustReps', delta: 1 })}
              >
                +
              </button>
            </div>
          ) : (
            <>
              {leadIn > 0 && <span className={styles.getReady}>Get into position</span>}
              <span
                className={styles.counter}
                role="timer"
                aria-label={
                  leadIn > 0
                    ? `Starting in ${Math.ceil(leadIn / 1000)} seconds`
                    : `${Math.ceil(remaining / 1000)} seconds left`
                }
              >
                {timer(leadIn > 0 ? leadIn : remaining)}
              </span>
            </>
          )}
        </div>

        <p className={styles.meta}>{meta}</p>

        <div className={styles.actions} style={{ gridTemplateColumns: '64px minmax(0, 1fr)' }}>
          <PauseButton
            paused={paused}
            onClick={() => dispatch({ type: paused ? 'resume' : 'pause', now: Date.now() })}
          />
          {paused ? (
            <button
              type="button"
              className={styles.primary}
              onClick={() => dispatch({ type: 'resume', now: Date.now() })}
            >
              Resume
            </button>
          ) : leadIn > 0 ? (
            <button
              type="button"
              className={styles.primary}
              onClick={() => dispatch({ type: 'startNow', now: Date.now() })}
            >
              Start now
            </button>
          ) : (
            <button
              type="button"
              className={styles.primary}
              onClick={() => dispatch({ type: 'setDone', now: Date.now() })}
            >
              Set done
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="5 12.5 10 17.5 19 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
