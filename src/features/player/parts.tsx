import { useState, type ReactNode, type Ref } from 'react'
import { ExerciseSlideshow } from '../../components/ExerciseSlideshow'
import { Rings } from '../../components/Rings'
import styles from './Player.module.css'
import progress from './Progress.module.css'
import type { PlayerScreen } from './screen'

export function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

export function PauseIcon({ paused }: { paused: boolean }) {
  return paused ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  ) : (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="9" y1="6" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="18" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
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
  )
}

/** Icon after the primary label: ✓ on Set done, ⏭ on Skip rest. */
export function PrimaryIcon({ action }: { action: PlayerScreen['primary'] }) {
  if (action === 'setDone')
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="5 12.5 10 17.5 19 7" />
      </svg>
    )
  if (action === 'skipRest')
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 5 13 12 6 19" />
        <line x1="18" y1="5" x2="18" y2="19" />
      </svg>
    )
  return null
}

/** − / + beside the bar: one rep. */
export function AdjustButton({
  sign,
  className,
  onClick,
}: {
  sign: -1 | 1
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={sign < 0 ? 'One rep fewer' : 'One rep more'}
      aria-keyshortcuts={sign < 0 ? 'ArrowLeft' : 'ArrowRight'}
      onClick={onClick}
    >
      {sign < 0 ? '−' : '+'}
    </button>
  )
}

/**
 * Bar under the counter (REDESIGN §3): a 4px track, the filled part, and an ember dot at last
 * time's best ringed in the screen's ground colour. Width and dot size come from the caller's class.
 */
export function Progress({
  fill,
  marker,
  label,
  className,
}: PlayerScreen['progress'] & { className?: string }) {
  return (
    <div className={`${progress.track} ${className ?? ''}`} role="img" aria-label={label}>
      <span className={progress.fill} style={{ width: `${fill * 100}%` }} />
      {marker !== undefined && <span className={progress.marker} style={{ left: `${marker * 100}%` }} />}
    </div>
  )
}

/** Rings behind the counter: brighter while counting, dimmer while getting into position. */
export function CounterRings({ ready, desktop }: { ready: boolean; desktop?: boolean }) {
  const radii = desktop ? [110, 160, 210, 260, 310, 360, 378] : [92, 132, 172, 212, 252, 292]
  const size = desktop ? 760 : 600
  const [start, step] = desktop
    ? ready
      ? [0.2, 0.027]
      : [0.32, 0.044]
    : ready
      ? [0.18, 0.028]
      : [0.32, 0.05]
  return (
    <Rings
      radii={radii}
      size={size}
      startOpacity={start}
      step={step}
      color="var(--g-accent)"
      // z-index -1: behind every other part of the player (name, bar, buttons, video card), not
      // just the counter. Absolutely positioned, they would otherwise paint over in-flow content.
      style={{ left: '50%', top: '50%', margin: `${-size / 2}px 0 0 ${-size / 2}px`, zIndex: -1 }}
    />
  )
}

/** The counter: a number (reps / MM:SS) or, while getting into position, two lines of text. */
export function Counter({
  screen,
  reps,
  className,
}: {
  screen: PlayerScreen
  reps: number
  className?: string
}) {
  const { counter, pulse } = screen
  if (counter.kind === 'ready') {
    return (
      <span className={className} data-kind="ready" role="timer" aria-label={counter.label}>
        Get into
        <br />
        position
      </span>
    )
  }
  return (
    <span
      key={pulse ?? (counter.kind === 'time' ? 'timer' : reps)}
      className={className}
      data-kind={counter.kind}
      data-pulse={pulse ?? undefined}
      role={counter.kind === 'time' ? 'timer' : undefined}
      aria-label={counter.label}
    >
      {counter.text}
    </span>
  )
}

/** The one line under the bar, with its optional accent dot. Pops in when it announces a New best. */
export function Line({ screen, className }: { screen: PlayerScreen; className?: string }) {
  const { line, newBest } = screen
  return (
    <p className={className} data-new-best={newBest || undefined}>
      {line.dot && (
        <span className={styles.dot} aria-hidden="true">
          ●{' '}
        </span>
      )}
      {line.text}
    </p>
  )
}

/**
 * The video card: the only thing on the player that flexes, so it is the same size in every phase.
 * Rest: "Up next" chip top-left. ⓘ top-right opens the info sheet for the move on screen. The
 * wake-lock notice sits bottom-centre as an overlay, so it never changes the layout.
 */
export function VideoCard({
  screen,
  onInfo,
  infoRef,
  notice,
  desktop,
}: {
  screen: PlayerScreen
  onInfo: () => void
  /** The ⓘ button: focus returns here when the info sheet closes. */
  infoRef?: Ref<HTMLButtonElement>
  notice?: string
  desktop?: boolean
}) {
  const { media, tag, paused, resting } = screen
  return (
    <div
      className={styles.video}
      data-desktop={desktop || undefined}
      data-photo={(media.exercise?.images.length ?? 0) > 0 || undefined}
    >
      <ExerciseSlideshow
        className={styles.slideshow}
        images={media.exercise?.images}
        alt={`${media.name} demonstration${resting ? ', up next' : ''}`}
        still={paused}
      />
      {tag && (
        <span className={styles.upNext}>
          <span className={styles.upNextDot} aria-hidden="true" />
          {tag}
        </span>
      )}
      <button
        ref={infoRef}
        type="button"
        className={desktop ? styles.infoPill : styles.info}
        aria-label={`Exercise info: ${media.name}${resting ? ', up next' : ''}`}
        aria-keyshortcuts={desktop ? 'I' : undefined}
        onClick={onInfo}
      >
        <InfoIcon />
        {desktop && (
          <>
            Exercise info <Kbd>I</Kbd>
          </>
        )}
      </button>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
    </div>
  )
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={`${styles.kbd} ${className ?? ''}`}>{children}</kbd>
}

/**
 * Work ⇄ rest: a layer in the previous mode's colour that drops away to the top, so the new colour
 * rises from the bottom (where Set done / Skip rest sit). Nothing on first render. Hidden by CSS under
 * reduced motion.
 */
export function Sweep({ mode, className }: { mode: 'work' | 'rest'; className?: string }) {
  const [sweep, setSweep] = useState<{ mode: string; from?: string; n: number }>({ mode, n: 0 })
  // Derived from the previous render (React's "storing information from previous renders" pattern).
  if (mode !== sweep.mode) setSweep({ mode, from: sweep.mode, n: sweep.n + 1 })
  return sweep.from ? (
    <span key={sweep.n} className={className} data-from={sweep.from} aria-hidden="true" />
  ) : null
}
