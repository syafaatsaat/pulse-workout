import type { Dispatch } from 'react'
import { ExerciseSlideshow } from '../../components/ExerciseSlideshow'
import { SessionBar } from '../../components/SessionBar'
import type { PlayerAction, PlayerState } from '../../engine/playerReducer'
import { AdjustButton, CloseButton, Header, PauseButton, Progress } from './parts'
import styles from './Player.module.css'
import { runAdjust, runPrimary, type PlayerScreen } from './screen'

interface PhoneViewProps {
  state: PlayerState
  screen: PlayerScreen
  dispatch: Dispatch<PlayerAction>
  onEnd: () => void
  onForm: () => void
  /** One-line hint under the header, e.g. when the screen can't be kept awake. */
  notice?: string
}

const PRIMARY_LABEL = { resume: 'Resume', skipRest: 'Skip rest', startNow: 'Start now', setDone: 'Set done' }

/**
 * Phone player, work and rest alike (2a / 2b / 2c): session bar, position, name or "Rest",
 * slideshow, counter with − / +, progress bar, two info cards, pause | primary.
 */
export function PhoneView({ state, screen, dispatch, onEnd, onForm, notice }: PhoneViewProps) {
  const { resting, paused, adjust, primary } = screen
  return (
    <div className={styles.player} data-mode={resting ? 'rest' : 'work'}>
      <div className={styles.inner}>
        <SessionBar
          steps={state.steps}
          current={state.index}
          label={`Session progress: ${screen.position}`}
        />
        <Header left={<CloseButton onClick={onEnd} />} title={screen.position} />
        {notice && <p className={styles.notice}>{notice}</p>}

        <h1 className={styles.name} data-long={screen.title.length > 12 || undefined}>
          {screen.title}
        </h1>

        <div className={styles.media}>
          <ExerciseSlideshow
            className={styles.photo}
            images={screen.media.exercise?.images}
            alt={`${screen.media.name} demonstration`}
            still={paused}
          />
          {screen.tag && <span className={styles.tag}>{screen.tag}</span>}
        </div>

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
            data-timer={screen.counter.timer || undefined}
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

        <dl className={styles.cards}>
          {screen.cards.map((card) => (
            <div key={card.label} className={styles.card} data-cue={card.cue || undefined}>
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

        <div className={styles.actions}>
          <PauseButton
            paused={paused}
            onClick={() => dispatch({ type: paused ? 'resume' : 'pause', now: Date.now() })}
          />
          <button type="button" className={styles.primary} onClick={() => runPrimary(primary, dispatch)}>
            {PRIMARY_LABEL[primary]}
            {primary === 'setDone' && (
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
            )}
            {primary === 'skipRest' && (
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
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
