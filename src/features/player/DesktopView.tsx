import type { Dispatch, ReactNode } from 'react'
import { ExercisePhoto } from '../../components/ExercisePhoto'
import { RepTicks } from '../../components/RepTicks'
import { SessionBar } from '../../components/SessionBar'
import { stepWeight } from '../../components/stepWeight'
import type { Exercise } from '../../data/types'
import type { Step } from '../../engine/compile'
import { elapsedMs, remainingMs, type PlayerAction, type PlayerState } from '../../engine/playerReducer'
import type { SetValue } from '../../engine/stats'
import styles from './Desktop.module.css'
import { clock, elapsed, seconds } from './format'
import { dose, upNext } from './upNext'

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

const PHASE_LABEL = { warmup: 'Warm-up', main: 'Work', cooldown: 'Cool-down' } as const

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>
}

function lastLabel(last: SetValue | undefined): string {
  if (!last) return '—'
  return last.reps !== undefined ? `${last.reps} reps` : seconds(last.seconds ?? 0)
}

/** Full-screen desktop player (DT-Player): numbers scale with the viewport, side panel, shortcuts. */
export function DesktopView(props: DesktopViewProps) {
  const { state, step, now, moveCount, workoutName, blocks, exercises, lastTimes, dispatch, onEnd, notice } =
    props
  const resting = step.kind === 'rest'
  const paused = state.status === 'paused'
  const remaining = remainingMs(state, now) ?? 0
  const isReps = !resting && step.mode === 'reps'
  const exercise = exercises.get(step.exerciseId)
  const nextWork = state.steps.slice(state.index + 1).find((s) => s.kind === 'work')
  const nextExercise = nextWork && exercises.get(nextWork.exerciseId)
  const formExercise = resting ? nextExercise : exercise
  const last = lastTimes.get(step.exerciseId)
  const set = `Set ${step.setIndex + 1} of ${step.setCount}`
  const position = resting
    ? `${workoutName} · ${set} done`
    : `${workoutName} · Move ${step.moveIndex + 1} of ${moveCount} · ${set}`

  const bigNum = isReps
    ? String(state.reps).padStart(2, '0')
    : resting || step.target >= 60
      ? clock(remaining)
      : String(Math.ceil(remaining / 1000)).padStart(2, '0')
  const unit = resting
    ? `of ${clock(state.stepMs)} · +15s with ↑`
    : isReps
      ? `of ${step.target} reps`
      : `of ${seconds(step.target)}`

  // Facts: work = tempo + last time; rest = what's next + its target.
  const facts: [string, string][] = resting
    ? [
        ['Next', nextWork ? `${nextExercise?.name ?? nextWork.exerciseId}` : 'Finish'],
        ['Target', nextWork ? dose(nextWork) : '—'],
      ]
    : [
        ...(step.tempo ? [['Tempo', step.tempo.replaceAll('·', ' · ')] as [string, string]] : []),
        ['Last time', lastLabel(last)],
      ]
  if (!resting && step.phase !== 'main') facts.splice(facts.length - 1, 1, ['Target', dose(step)])

  // Block labels sit under their share of the bar.
  const blockWeights = blocks.map(({ blockId, label }) => ({
    label,
    weight: state.steps.filter((s) => s.blockId === blockId).reduce((w, s) => w + stepWeight(s), 0),
  }))

  const primaryLabel = paused ? 'Resume' : resting ? 'Skip rest' : 'Set done'

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
          <span className={styles.elapsed} aria-label="Elapsed">
            {paused && 'Paused · '}
            {elapsed(elapsedMs(state, now))}
          </span>
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
          <span className={styles.pill}>
            <span className={styles.pillDot} />
            {resting ? 'Rest' : PHASE_LABEL[step.phase]}
          </span>
          <h1 className={styles.name}>{resting ? 'Breathe' : (exercise?.name ?? step.exerciseId)}</h1>
          <div className={styles.counterRow}>
            <span className={styles.counter} role={resting ? 'timer' : undefined}>
              {bigNum}
            </span>
            {isReps && (
              <div className={styles.adjust}>
                <button
                  type="button"
                  aria-label="One rep fewer (left arrow)"
                  onClick={() => dispatch({ type: 'adjustReps', delta: -1 })}
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label="One rep more (right arrow)"
                  onClick={() => dispatch({ type: 'adjustReps', delta: 1 })}
                >
                  +
                </button>
              </div>
            )}
          </div>
          <div className={styles.unitRow}>
            <span className={styles.unit}>{unit}</span>
            {isReps && (
              <>
                <RepTicks value={state.reps} target={step.target} best={last?.reps} />
                <span className={styles.hint}>← → Adjust</span>
              </>
            )}
          </div>
        </section>

        <aside className={styles.side}>
          <div className={styles.form}>
            <ExercisePhoto
              path={formExercise?.images[0]}
              alt={`${formExercise?.name}: start position`}
              placeholderLabel="No photo for this move"
              placeholderClassName={styles.formPlaceholder}
            />
            {formExercise?.images[0] && (
              <ExercisePhoto
                path={formExercise.images[1]}
                className={styles.formEnd}
                alt={`${formExercise.name}: end position`}
                fallback="none"
              />
            )}
            <span className={styles.formTag}>{resting ? 'Next' : 'Form'}</span>
          </div>
          <dl
            className={styles.facts}
            style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}
          >
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.upNext}>
            <h2>Up next</h2>
            <ul>
              {upNext(state.steps, state.index, exercises).map((row, i) => (
                <li key={i}>
                  <span className={styles.upName}>{row.name}</span>
                  <span className={styles.upDose}>{row.dose}</span>
                </li>
              ))}
              {state.index >= state.steps.length - 1 && (
                <li>
                  <span className={styles.upName}>Finish</span>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </main>

      <footer className={styles.footer}>
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
        <button
          type="button"
          className={styles.cta}
          onClick={() => {
            const now = Date.now()
            if (paused) dispatch({ type: 'resume', now })
            else dispatch(resting ? { type: 'skipRest', now } : { type: 'setDone', now })
          }}
        >
          {primaryLabel}
          <Kbd>Space</Kbd>
        </button>
      </footer>
    </div>
  )
}
