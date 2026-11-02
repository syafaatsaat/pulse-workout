import type { Dispatch } from 'react'
import { formCue } from '../../data/formCues'
import type { Exercise } from '../../data/types'
import type { Step } from '../../engine/compile'
import { leadInMs, remainingMs, type PlayerAction, type PlayerState } from '../../engine/playerReducer'
import type { SetValue } from '../../engine/stats'
import { timer } from './format'
import { dose } from './upNext'

export interface ScreenCard {
  label: string
  value: string
  /** The form cue: plain text, and a button to the form overlay. */
  cue?: boolean
}

export type PrimaryAction = 'resume' | 'skipRest' | 'startNow' | 'setDone'

/** Everything the phone and desktop players draw, from one place. */
export interface PlayerScreen {
  resting: boolean
  paused: boolean
  /** "Move 4 of 9 · Set 2 of 4", "… done" on a rest. */
  position: string
  /** The move's name, or "Rest". */
  title: string
  /** The move in the slideshow: the current one, or during a rest the next one. */
  media: { exercise?: Exercise; name: string }
  /** Pill on the slideshow: "Up next · Push-up · Set 3 of 4" / "Get into position". */
  tag?: string
  counter: { text: string; label: string; timer: boolean }
  /** What − / + do; null while there's nothing to adjust (the lead-in). */
  adjust: 'reps' | 'time' | null
  /** Bar under the counter, 0–1: reps done of the target, time held, or rest left. Marker = last time. */
  progress: { fill: number; marker?: number }
  cards: ScreenCard[]
  primary: PrimaryAction
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
): PlayerScreen {
  const resting = step.kind === 'rest'
  const paused = state.status === 'paused'
  const remaining = remainingMs(state, now) ?? 0
  const leadIn = leadInMs(state, now)
  const nameOf = (s: Step) => exercises.get(s.exerciseId)?.name ?? s.exerciseId
  const position = `Move ${step.moveIndex + 1} of ${moveCount} · Set ${step.setIndex + 1} of ${step.setCount}${resting ? ' done' : ''}`
  const primary: PrimaryAction = paused
    ? 'resume'
    : resting
      ? 'skipRest'
      : leadIn > 0
        ? 'startNow'
        : 'setDone'

  if (resting) {
    const next = state.steps.slice(state.index + 1).find((s) => s.kind === 'work')
    const lastSet = state.sets.at(-1)
    const secs = Math.ceil(remaining / 1000)
    return {
      resting,
      paused,
      position,
      title: 'Rest',
      media: next ? { exercise: exercises.get(next.exerciseId), name: nameOf(next) } : { name: 'Finish' },
      tag: next
        ? `Up next · ${nameOf(next)} · Set ${next.setIndex + 1} of ${next.setCount}`
        : 'Up next · Finish',
      counter: { text: timer(remaining), label: `Rest, ${secs} seconds left`, timer: true },
      adjust: 'time',
      progress: { fill: state.stepMs > 0 ? clamp01(remaining / state.stepMs) : 0 },
      cards: [
        { label: 'Next target', value: next ? dose(next) : 'Finish' },
        ...(lastSet ? [{ label: 'Last set', value: describe(lastSet) }] : []),
      ],
      primary,
    }
  }

  const exercise = exercises.get(step.exerciseId)
  const name = nameOf(step)
  // Warm-up / cool-down run to the clock: "last time" says nothing there.
  const last = step.phase === 'main' ? lastTimes.get(step.exerciseId) : undefined
  const cue = formCue(exercise)
  const cards: ScreenCard[] = [
    ...(cue ? [{ label: 'Form cue', value: cue, cue: true }] : []),
    ...(step.phase === 'main' ? [{ label: 'Last time', value: last ? describe(last) : '—' }] : []),
  ]
  const base = { resting, paused, position, title: name, media: { exercise, name }, cards, primary }

  if (step.mode === 'reps') {
    const lastReps = last?.reps
    const scale = Math.max(step.target, state.reps, lastReps ?? 0, 1)
    return {
      ...base,
      counter: { text: String(state.reps).padStart(2, '0'), label: `${state.reps} reps`, timer: false },
      adjust: 'reps',
      progress: {
        fill: state.reps / scale,
        ...(lastReps !== undefined && { marker: lastReps / scale }),
      },
    }
  }

  const hold = Math.min(remaining, state.stepMs)
  const lastMs = last?.seconds !== undefined ? last.seconds * 1000 : undefined
  return {
    ...base,
    tag: leadIn > 0 ? 'Get into position' : undefined,
    counter: {
      text: timer(leadIn > 0 ? leadIn : hold),
      label:
        leadIn > 0
          ? `Starting in ${Math.ceil(leadIn / 1000)} seconds`
          : `${Math.ceil(hold / 1000)} seconds left`,
      timer: true,
    },
    adjust: leadIn > 0 ? null : 'time',
    progress: {
      fill: state.stepMs > 0 ? clamp01(1 - hold / state.stepMs) : 1,
      ...(lastMs !== undefined && state.stepMs > 0 && { marker: clamp01(lastMs / state.stepMs) }),
    },
  }
}

/** Runs the primary button (and Space). */
export function runPrimary(action: PrimaryAction, dispatch: Dispatch<PlayerAction>): void {
  dispatch({ type: action, now: Date.now() })
}

/** − / + : one rep, or 15 s on a rest or a hold. */
export function runAdjust(
  adjust: PlayerScreen['adjust'],
  sign: -1 | 1,
  dispatch: Dispatch<PlayerAction>,
): void {
  if (adjust === 'reps') dispatch({ type: 'adjustReps', delta: sign })
  else if (adjust === 'time') dispatch({ type: 'addTime', ms: sign * 15_000, now: Date.now() })
}
