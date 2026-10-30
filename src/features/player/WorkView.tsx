import type { Dispatch } from 'react'
import { RepTicks } from '../../components/RepTicks'
import { SessionBar } from '../../components/SessionBar'
import type { Exercise } from '../../data/types'
import type { Step } from '../../engine/compile'
import { elapsedMs, remainingMs, type PlayerAction, type PlayerState } from '../../engine/playerReducer'
import type { SetValue } from '../../engine/stats'
import { clock, elapsed, seconds } from './format'
import { CloseButton, Header, Pill } from './parts'
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
}

const PHASE_LABEL = { warmup: 'Warm-up', main: 'Work', cooldown: 'Cool-down' } as const

function describe(last: SetValue | undefined): string {
  if (!last) return '—'
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
  moveCount,
  exercise,
  next,
  nextExercise,
  last,
  dispatch,
  onEnd,
  onForm,
}: WorkViewProps) {
  const paused = state.status === 'paused'
  const name = exercise?.name ?? step.exerciseId
  const remaining = remainingMs(state, now) ?? 0
  const isReps = step.mode === 'reps'
  const long = !isReps && step.target >= 60
  const counter = isReps
    ? String(state.reps).padStart(2, '0')
    : long
      ? clock(remaining)
      : String(Math.ceil(remaining / 1000)).padStart(2, '0')
  // Warm-up / cool-down run to the clock: "last time" says nothing there.
  const showLast = step.phase === 'main'
  const columns = 1 + (step.tempo ? 1 : 0) + (showLast ? 1 : 0)
  const position = `Move ${step.moveIndex + 1} of ${moveCount} · Set ${step.setIndex + 1} of ${step.setCount}`

  return (
    <div className={styles.player} data-mode="work">
      <div className={styles.inner}>
        <SessionBar steps={state.steps} current={state.index} label={`Session progress: ${position}`} />
        <Header
          left={<CloseButton onClick={onEnd} />}
          title={position}
          sub={paused ? 'Paused' : `${elapsed(elapsedMs(state, now))} elapsed`}
          right={
            <button
              type="button"
              className={styles.round}
              aria-label={`Check form for ${name}`}
              onClick={onForm}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-5-8 8" />
              </svg>
            </button>
          }
        />

        <div className={styles.titleBlock}>
          <Pill>{PHASE_LABEL[step.phase]}</Pill>
          <h1 className={styles.name} data-long={name.length > 14 || undefined}>
            {name}
          </h1>
        </div>

        <div className={styles.stage}>
          <span className={styles.counter} data-long={long || undefined} aria-live="off">
            {counter}
          </span>
          <span className={styles.counterSub}>
            {isReps ? `of ${step.target} reps` : `of ${seconds(step.target)}`}
          </span>
          {isReps && (
            <>
              <RepTicks value={state.reps} target={step.target} best={last?.reps} />
              <div className={styles.adjust}>
                <button
                  type="button"
                  aria-label="One rep fewer"
                  onClick={() => dispatch({ type: 'adjustReps', delta: -1 })}
                >
                  −
                </button>
                <span>Adjust</span>
                <button
                  type="button"
                  aria-label="One rep more"
                  onClick={() => dispatch({ type: 'adjustReps', delta: 1 })}
                >
                  +
                </button>
              </div>
            </>
          )}
        </div>

        <dl className={styles.info} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {step.tempo && (
            <div>
              <dt>Tempo</dt>
              <dd>{step.tempo}</dd>
            </div>
          )}
          {showLast && (
            <div>
              <dt>Last time</dt>
              <dd>{describe(last)}</dd>
            </div>
          )}
          <div>
            <dt>Next</dt>
            <dd>{nextLabel(next, nextExercise)}</dd>
          </div>
        </dl>

        <div className={styles.actions} style={{ gridTemplateColumns: '64px minmax(0, 1fr)' }}>
          <button
            type="button"
            className={styles.secondary}
            aria-label={paused ? 'Resume' : 'Pause'}
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
          </button>
          {paused ? (
            <button
              type="button"
              className={styles.primary}
              onClick={() => dispatch({ type: 'resume', now: Date.now() })}
            >
              Resume
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
