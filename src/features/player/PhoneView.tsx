import type { Dispatch } from 'react'
import { SessionBar } from '../../components/SessionBar'
import type { PlayerAction, PlayerState } from '../../engine/playerReducer'
import {
  AdjustButton,
  CloseIcon,
  Counter,
  CounterRings,
  Line,
  PauseIcon,
  PrimaryIcon,
  Progress,
  Sweep,
  VideoCard,
} from './parts'
import styles from './Player.module.css'
import { PRIMARY_LABEL, runAddTime, runAdjust, runPrimary, type PlayerScreen } from './screen'

interface PhoneViewProps {
  state: PlayerState
  screen: PlayerScreen
  dispatch: Dispatch<PlayerAction>
  onEnd: () => void
  onInfo: () => void
  /** Shown over the video card, e.g. when the screen can't be kept awake. */
  notice?: string
}

/**
 * Phone player (G-Player / G-Rest / G-Timed): one fixed layout for every phase. Everything has a
 * fixed height except the video card, so the video is the same size on work, rest, get-ready and hold.
 */
export function PhoneView({ state, screen, dispatch, onEnd, onInfo, notice }: PhoneViewProps) {
  const { resting, paused, adjust, primary } = screen
  return (
    <div className={`${styles.ground} ${styles.player}`} data-mode={resting ? 'rest' : 'work'}>
      <Sweep mode={resting ? 'rest' : 'work'} className={styles.sweep} />
      <div className={styles.inner}>
        <div className={styles.top}>
          <button type="button" className={styles.round} aria-label="End session" onClick={onEnd}>
            <CloseIcon />
          </button>
          <span className={styles.position}>{screen.header}</span>
          <span />
        </div>
        <div className={styles.sessionBar}>
          <SessionBar
            steps={state.steps}
            current={state.index}
            label={`Session progress: ${screen.position}`}
          />
        </div>

        <VideoCard screen={screen} onInfo={onInfo} notice={notice} />

        <h1 className={styles.name}>{screen.title}</h1>

        <div className={styles.counterRow}>
          <CounterRings ready={screen.counter.kind === 'ready'} />
          <Counter screen={screen} reps={state.reps} className={styles.counter} />
        </div>

        <div className={styles.barRow}>
          {adjust && (
            <AdjustButton
              sign={-1}
              className={styles.adjust}
              onClick={() => runAdjust(adjust, -1, dispatch)}
            />
          )}
          <Progress className={styles.progress} {...screen.progress} />
          {adjust && (
            <AdjustButton sign={1} className={styles.adjust} onClick={() => runAdjust(adjust, 1, dispatch)} />
          )}
        </div>

        <Line screen={screen} className={styles.line} />

        <div className={styles.actions} data-add-time={screen.addTime || undefined}>
          <button
            type="button"
            className={styles.secondary}
            aria-label={paused ? 'Resume' : 'Pause'}
            onClick={() => dispatch({ type: paused ? 'resume' : 'pause', now: Date.now() })}
          >
            <PauseIcon paused={paused} />
          </button>
          {screen.addTime && (
            <button
              type="button"
              className={styles.secondary}
              aria-label="Add 15 seconds of rest"
              aria-keyshortcuts="ArrowUp"
              onClick={() => runAddTime(screen, dispatch)}
            >
              +15s
            </button>
          )}
          <button
            type="button"
            className={styles.primary}
            data-action={primary}
            onClick={() => runPrimary(primary, dispatch)}
          >
            {PRIMARY_LABEL[primary]}
            <PrimaryIcon action={primary} />
          </button>
        </div>
      </div>
    </div>
  )
}
