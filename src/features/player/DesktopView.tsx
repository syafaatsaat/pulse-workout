import type { Dispatch, ReactNode } from 'react'
import { ExerciseSlideshow } from '../../components/ExerciseSlideshow'
import { SessionBar } from '../../components/SessionBar'
import { stepWeight } from '../../components/stepWeight'
import type { Exercise } from '../../data/types'
import type { PlayerAction, PlayerState } from '../../engine/playerReducer'
import styles from './Desktop.module.css'
import { AdjustButton, Progress } from './parts'
import { runAdjust, runPrimary, type PlayerScreen } from './screen'
import { upNext } from './upNext'

interface DesktopViewProps {
  state: PlayerState
  screen: PlayerScreen
  workoutName: string
  blocks: { blockId: string; label: string }[]
  exercises: Map<string, Exercise>
  dispatch: Dispatch<PlayerAction>
  onEnd: () => void
  onForm: () => void
  notice?: string
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>
}

const PRIMARY_LABEL = { resume: 'Resume', skipRest: 'Skip rest', startNow: 'Start now', setDone: 'Set done' }

/**
 * Full-screen desktop player: header with the session bar and block labels; large slideshow |
 * name, counter with − / +, progress bar, info cards and the coming-up list; pause | primary.
 */
export function DesktopView(props: DesktopViewProps) {
  const { state, screen, workoutName, blocks, exercises, dispatch, onEnd, onForm, notice } = props
  const { resting, paused, adjust, primary } = screen
  const position = `${workoutName} · ${screen.position}`
  // During a rest the next move is already on screen (the slideshow pill), so the list starts after it.
  const later = upNext(state.steps, state.index, exercises, resting ? 4 : 3).slice(resting ? 1 : 0)
  const rows = [...later, ...(later.length < 3 ? [{ name: 'Finish', dose: '' }] : [])]

  // Block labels sit under their share of the bar.
  const blockWeights = blocks.map(({ blockId, label }) => ({
    label,
    weight: state.steps.filter((s) => s.blockId === blockId).reduce((w, s) => w + stepWeight(s), 0),
  }))

  return (
    <div className={styles.desk} data-mode={resting ? 'rest' : 'work'}>
      <header className={styles.header}>
        <div className={styles.top}>
          <button type="button" className={styles.chip} onClick={onEnd} aria-keyshortcuts="Escape">
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
        <div className={styles.media}>
          <ExerciseSlideshow
            className={styles.slideshow}
            images={screen.media.exercise?.images}
            alt={`${screen.media.name} demonstration`}
            still={paused}
          />
          {screen.tag && <span className={styles.tag}>{screen.tag}</span>}
        </div>

        <section className={styles.side}>
          <h1 className={styles.name} data-long={screen.title.length > 14 || undefined}>
            {screen.title}
          </h1>

          <div className={styles.count}>
            <div className={styles.counterRow}>
              {adjust ? (
                <AdjustButton
                  adjust={adjust}
                  sign={-1}
                  className={styles.adjust}
                  onClick={() => runAdjust(adjust, -1, dispatch)}
                />
              ) : (
                <span />
              )}
              <span
                className={styles.counter}
                role={screen.counter.timer ? 'timer' : undefined}
                aria-label={screen.counter.label}
              >
                {screen.counter.text}
              </span>
              {adjust ? (
                <AdjustButton
                  adjust={adjust}
                  sign={1}
                  className={styles.adjust}
                  onClick={() => runAdjust(adjust, 1, dispatch)}
                />
              ) : (
                <span />
              )}
            </div>
            <Progress className={styles.progress} {...screen.progress} />
            <span className={styles.hint} aria-hidden="true">
              {adjust === 'reps' ? '← → adjust reps' : adjust === 'time' ? '← → −15 / +15 s' : ' '}
            </span>
          </div>

          <div className={styles.cards}>
            <dl className={styles.info}>
              {screen.cards.map((card) => (
                <div key={card.label} className={styles.card}>
                  <dt>{card.label}</dt>
                  <dd>
                    {card.cue ? (
                      <button
                        type="button"
                        className={styles.cue}
                        aria-label={`${card.value}. How to do ${screen.media.name}`}
                        onClick={onForm}
                      >
                        {card.value}
                      </button>
                    ) : (
                      <span className={styles.cardValue}>{card.value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <section className={styles.coming} aria-labelledby="coming-up">
              <h2 id="coming-up" className={styles.comingTitle}>
                Coming up
              </h2>
              <ol className={styles.comingList}>
                {rows.slice(0, 3).map((row, i) => (
                  <li key={i}>
                    <span className={styles.comingName}>{row.name}</span>
                    <span className={styles.comingDose}>{row.dose}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.pause}
          aria-keyshortcuts="P"
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
          aria-keyshortcuts="Space"
          onClick={() => runPrimary(primary, dispatch)}
        >
          {PRIMARY_LABEL[primary]}
          <Kbd>Space</Kbd>
        </button>
      </footer>
    </div>
  )
}
