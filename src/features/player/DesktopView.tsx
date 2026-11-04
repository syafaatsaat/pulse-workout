import type { Dispatch, Ref } from 'react'
import { SessionBar } from '../../components/SessionBar'
import type { PlayerAction, PlayerState } from '../../engine/playerReducer'
import styles from './Desktop.module.css'
import {
  AdjustButton,
  CloseIcon,
  Counter,
  CounterRings,
  Kbd,
  Line,
  PauseIcon,
  Progress,
  Sweep,
  VideoCard,
} from './parts'
import ground from './Player.module.css'
import { PRIMARY_LABEL, runAddTime, runAdjust, runPrimary, type PlayerScreen } from './screen'

interface DesktopViewProps {
  state: PlayerState
  screen: PlayerScreen
  workoutName: string
  dispatch: Dispatch<PlayerAction>
  onEnd: () => void
  onInfo: () => void
  infoRef: Ref<HTMLButtonElement>
  notice?: string
}

/**
 * Full-screen desktop player (GD-Player): End chip · position, session bar; video (flex 3) |
 * name, counter, bar, one line (flex 2, ≤540px); footer with Pause, +15s on rest, and the main
 * action, each with its key.
 */
export function DesktopView(props: DesktopViewProps) {
  const { state, screen, workoutName, dispatch, onEnd, onInfo, infoRef, notice } = props
  const { resting, paused, adjust, primary } = screen
  const position = `${workoutName} · ${screen.position}`

  return (
    <div className={`${ground.ground} ${styles.desk}`} data-mode={resting ? 'rest' : 'work'}>
      <Sweep mode={resting ? 'rest' : 'work'} className={ground.sweep} />
      <header className={styles.header}>
        <div className={styles.top}>
          <button type="button" className={styles.chip} onClick={onEnd} aria-keyshortcuts="Escape">
            <CloseIcon />
            End session <Kbd>Esc</Kbd>
          </button>
          <span className={styles.position}>{position}</span>
          <span />
        </div>
        <SessionBar steps={state.steps} current={state.index} label={`Session progress: ${position}`} />
      </header>

      {/* A div: the full-screen layout already provides <main>. */}
      <div className={styles.main}>
        <div className={styles.media}>
          <VideoCard screen={screen} onInfo={onInfo} infoRef={infoRef} notice={notice} desktop />
        </div>

        <section className={styles.side}>
          <h1 className={styles.name}>{screen.title}</h1>

          <div className={styles.counterRow}>
            <CounterRings ready={screen.counter.kind === 'ready'} desktop />
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
              <AdjustButton
                sign={1}
                className={styles.adjust}
                onClick={() => runAdjust(adjust, 1, dispatch)}
              />
            )}
          </div>

          <Line screen={screen} className={styles.line} />
        </section>
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.secondary}
          aria-keyshortcuts="P"
          onClick={() => dispatch({ type: paused ? 'resume' : 'pause', now: Date.now() })}
        >
          <PauseIcon paused={paused} />
          {paused ? 'Resume' : 'Pause'} <Kbd className={styles.kbd}>P</Kbd>
        </button>
        {screen.addTime && (
          <button
            type="button"
            className={styles.secondary}
            aria-label="Add 15 seconds of rest"
            aria-keyshortcuts="ArrowUp"
            onClick={() => runAddTime(screen, dispatch)}
          >
            +15s <Kbd className={styles.kbd}>↑</Kbd>
          </button>
        )}
        <button
          type="button"
          className={styles.cta}
          data-action={primary}
          aria-keyshortcuts="Space"
          onClick={() => runPrimary(primary, dispatch)}
        >
          {PRIMARY_LABEL[primary]}
          <kbd className={styles.ctaKbd}>Space</kbd>
        </button>
      </footer>
    </div>
  )
}
