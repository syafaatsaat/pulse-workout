import type { Dispatch } from 'react'
import type { Exercise } from '../../data/types'
import { LEAD_IN_MS, type Step } from '../../engine/compile'
import { leadInMs, remainingMs, type PlayerAction, type PlayerState } from '../../engine/playerReducer'
import { isNewBest, type Best, type SetValue } from '../../engine/stats'
import { timer } from './format'
import { dose } from './upNext'

export type PrimaryAction = 'resume' | 'skipRest' | 'startNow' | 'setDone'

export const PRIMARY_LABEL = {
  resume: 'Resume',
  skipRest: 'Skip rest',
  startNow: 'Start now',
  setDone: 'Set done',
} as const

/** The one line of text under the bar (REDESIGN §4.1). `dot` = an ember (or rest-accent) dot before it. */
export interface ScreenLine {
  text: string
  dot?: 'accent'
}

/** Everything the phone and desktop players draw, from one place. */
export interface PlayerScreen {
  resting: boolean
  paused: boolean
  /** "Move 4 of 9 · Set 2 of 4", "… done" on a rest. */
  position: string
  /** Phone top row: the position, shortened to "Set 2 of 4 done" on a rest (G-Rest). */
  header: string
  /** The move's name, or "Rest". */
  title: string
  /** The move in the video card and info sheet: the current one, or during a rest the next one. */
  media: { exercise?: Exercise; name: string }
  /** Chip on the video card during a rest: "Up next · Push-up". */
  tag?: string
  /**
   * reps: "08". time: "MM:SS" (rest or hold). ready: the 5 s get-into-position lead-in, drawn as
   * text, not a number.
   */
  counter: { kind: 'reps' | 'time' | 'ready'; text: string; label: string }
  /** − / + beside the bar: reps only. */
  adjust: 'reps' | null
  /** +15 s button (and ↑): rests only. */
  addTime: boolean
  /** Bar under the counter, 0–1. Marker = last time's best (the ember dot). */
  progress: { fill: number; marker?: number; label: string }
  line: ScreenLine
  /** The last set beat the move's personal best (rest only): the line says so. Keys the pop. */
  newBest: boolean
  primary: PrimaryAction
  /** 3, 2, 1 in the last seconds of a running countdown (the beeps); null otherwise. Keys the pulse. */
  pulse: number | null
}

/** "10 reps" / "00:35". */
export function describe(value: SetValue): string {
  return value.reps !== undefined ? `${value.reps} reps` : timer((value.seconds ?? 0) * 1000)
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export function playerScreen(
  state: PlayerState,
  step: Step,
  now: number,
  moveCount: number,
  exercises: Map<string, Exercise>,
  lastTimes: Map<string, SetValue>,
  /** Each move's personal best from earlier sessions. */
  bests: Map<string, Best>,
): PlayerScreen {
  const resting = step.kind === 'rest'
  const paused = state.status === 'paused'
  const remaining = remainingMs(state, now) ?? 0
  const leadIn = leadInMs(state, now)
  const nameOf = (s: Step) => exercises.get(s.exerciseId)?.name ?? s.exerciseId
  const set = `Set ${step.setIndex + 1} of ${step.setCount}${resting ? ' done' : ''}`
  const position = `Move ${step.moveIndex + 1} of ${moveCount} · ${set}`
  const primary: PrimaryAction = paused
    ? 'resume'
    : resting
      ? 'skipRest'
      : leadIn > 0
        ? 'startNow'
        : 'setDone'
  // What the counter counts down, for the 3-2-1 pulse.
  const shownMs = resting
    ? remaining
    : step.mode === 'time'
      ? leadIn > 0
        ? leadIn
        : Math.min(remaining, state.stepMs)
      : 0
  const pulse =
    state.status === 'running' && shownMs > 0 && shownMs <= 3000 ? Math.ceil(shownMs / 1000) : null
  const common = { resting, paused, position, primary, pulse, adjust: null, addTime: false, newBest: false }

  if (resting) {
    const next = state.steps.slice(state.index + 1).find((s) => s.kind === 'work')
    const lastSet = state.sets.at(-1)
    const secs = Math.ceil(remaining / 1000)
    const newBest =
      lastSet !== undefined && isNewBest(bests.get(lastSet.exerciseId), state.sets.slice(0, -1), lastSet)
    return {
      ...common,
      header: set,
      title: 'Rest',
      media: next ? { exercise: exercises.get(next.exerciseId), name: nameOf(next) } : { name: 'Finish' },
      tag: `Up next · ${next ? nameOf(next) : 'Finish'}`,
      counter: { kind: 'time', text: timer(remaining), label: `Rest, ${secs} seconds left` },
      addTime: true,
      progress: {
        fill: state.stepMs > 0 ? clamp01(remaining / state.stepMs) : 0,
        label: `${secs} of ${Math.round(state.stepMs / 1000)} seconds of rest left`,
      },
      line:
        newBest && lastSet
          ? { text: `New best · ${describe(lastSet)}`, dot: 'accent' }
          : { text: next ? `Next set: ${dose(next)}` : 'Last set done' },
      newBest,
    }
  }

  const exercise = exercises.get(step.exerciseId)
  const name = nameOf(step)
  // Warm-up / cool-down run to the clock: "last time" says nothing there.
  const last = step.phase === 'main' ? lastTimes.get(step.exerciseId) : undefined
  const line: ScreenLine = last
    ? { text: `Last time ${describe(last)}`, dot: 'accent' }
    : {
        text:
          step.phase === 'warmup'
            ? 'Warm-up'
            : step.phase === 'cooldown'
              ? 'Cool-down'
              : 'First time: no record yet',
      }
  const base = { ...common, header: position, title: name, media: { exercise, name }, line }

  if (step.mode === 'reps') {
    const lastReps = last?.reps
    const scale = Math.max(step.target, state.reps, lastReps ?? 0, 1)
    return {
      ...base,
      counter: {
        kind: 'reps',
        text: String(state.reps).padStart(2, '0'),
        label: `${state.reps} reps`,
      },
      adjust: 'reps',
      progress: {
        fill: state.reps / scale,
        ...(lastReps !== undefined && { marker: lastReps / scale }),
        label: `${state.reps} of ${step.target} reps${lastReps !== undefined ? `; last time ${lastReps}` : ''}`,
      },
    }
  }

  if (leadIn > 0) {
    return {
      ...base,
      counter: {
        kind: 'ready',
        text: 'Get into position',
        label: `Get into position: the timer starts in ${Math.ceil(leadIn / 1000)} seconds`,
      },
      progress: {
        fill: clamp01(1 - leadIn / LEAD_IN_MS),
        label: 'Getting into position; the timer starts when the line is full',
      },
      line: { text: 'Timer starts when the line fills' },
    }
  }

  const hold = Math.min(remaining, state.stepMs)
  const lastMs = last?.seconds !== undefined ? last.seconds * 1000 : undefined
  const holdSecs = Math.ceil(hold / 1000)
  return {
    ...base,
    counter: { kind: 'time', text: timer(hold), label: `${holdSecs} seconds left` },
    progress: {
      fill: state.stepMs > 0 ? clamp01(1 - hold / state.stepMs) : 1,
      ...(lastMs !== undefined && state.stepMs > 0 && { marker: clamp01(lastMs / state.stepMs) }),
      label: `${holdSecs} seconds left of ${Math.round(state.stepMs / 1000)}${
        last?.seconds !== undefined ? `; last time you held ${last.seconds} seconds` : ''
      }`,
    },
  }
}

/** Runs the primary button (and Space). */
export function runPrimary(action: PrimaryAction, dispatch: Dispatch<PlayerAction>): void {
  dispatch({ type: action, now: Date.now() })
}

/** − / + : one rep. Nothing on timed steps. */
export function runAdjust(
  adjust: PlayerScreen['adjust'],
  sign: -1 | 1,
  dispatch: Dispatch<PlayerAction>,
): void {
  if (adjust === 'reps') dispatch({ type: 'adjustReps', delta: sign })
}

/** +15 s on a rest (button and ↑). */
export function runAddTime(screen: PlayerScreen, dispatch: Dispatch<PlayerAction>): void {
  if (screen.addTime) dispatch({ type: 'addTime', ms: 15_000, now: Date.now() })
}
