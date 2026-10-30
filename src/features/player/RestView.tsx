import type { Dispatch } from 'react'
import { ImagePlaceholder } from '../../components/ImagePlaceholder'
import { Ring } from '../../components/Ring'
import { SessionBar } from '../../components/SessionBar'
import type { Exercise } from '../../data/types'
import type { Step } from '../../engine/compile'
import { elapsedMs, remainingMs, type PlayerAction, type PlayerState } from '../../engine/playerReducer'
import { clock, elapsed, seconds } from './format'
import { CloseButton, Header, Pill } from './parts'
import styles from './Player.module.css'

interface RestViewProps {
  state: PlayerState
  step: Step
  now: number
  moveCount: number
  next?: Step
  nextExercise?: Exercise
  dispatch: Dispatch<PlayerAction>
  onEnd: () => void
}

export function RestView({ state, step, now, next, nextExercise, dispatch, onEnd }: RestViewProps) {
  const remaining = remainingMs(state, now) ?? 0
  const done = `Set ${step.setIndex + 1} of ${step.setCount} done`
  const nextName = nextExercise?.name ?? next?.exerciseId ?? ''
  const nextImage = nextExercise?.images[0]
  const nextDetail = next
    ? [
        next.mode === 'reps' ? `${next.target} reps` : seconds(next.target),
        next.tempo && `Tempo ${next.tempo}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <div className={styles.player} data-mode="rest">
      <div className={styles.inner}>
        <SessionBar
          steps={state.steps}
          current={state.index}
          label={`Session progress: resting after ${done.toLowerCase()}`}
        />
        <Header
          left={<CloseButton onClick={onEnd} />}
          title={done}
          sub={state.status === 'paused' ? 'Paused' : `${elapsed(elapsedMs(state, now))} elapsed`}
        />

        <div className={styles.titleBlock}>
          <Pill>Rest</Pill>
          <h1 className={styles.name}>Breathe</h1>
        </div>

        <div className={styles.stage}>
          <div
            className={styles.restRing}
            role="timer"
            aria-label={`${Math.ceil(remaining / 1000)} of ${step.target} seconds left`}
          >
            <Ring
              value={remaining}
              max={state.stepMs}
              size={280}
              stroke={10}
              className={styles.restRingSvg}
            />
            <div className={styles.restRingText}>
              <span className={styles.restCount}>{clock(remaining)}</span>
              <span className={styles.restOf}>of {clock(state.stepMs)}</span>
            </div>
          </div>
        </div>

        {next && (
          <div className={styles.upNext}>
            {nextImage ? (
              <img
                className={styles.upNextThumb}
                src={`/exercises/${nextImage}`}
                alt=""
                width={76}
                height={76}
              />
            ) : (
              <ImagePlaceholder className={styles.upNextThumb} label={`Photo placeholder: ${nextName}`} />
            )}
            <div className={styles.upNextText}>
              <span className={styles.upNextEyebrow}>
                Up next · Set {next.setIndex + 1} of {next.setCount}
              </span>
              <span className={styles.upNextName}>{nextName}</span>
              <span className={styles.upNextDetail}>{nextDetail}</span>
            </div>
          </div>
        )}

        <div className={styles.actions} style={{ gridTemplateColumns: '96px minmax(0, 1fr)' }}>
          <button
            type="button"
            className={`${styles.secondary} ${styles.addTime}`}
            onClick={() => dispatch({ type: 'addTime', ms: 15_000 })}
          >
            +15s
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => dispatch({ type: 'skipRest', now: Date.now() })}
          >
            Skip rest
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 5 13 12 6 19" />
              <line x1="18" y1="5" x2="18" y2="19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
