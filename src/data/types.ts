import type { ThemePref } from '../app/theme'

export type { Exercise } from './exerciseTypes'

export type ItemMode = 'reps' | 'time'

export interface WorkoutItem {
  id: string
  exerciseId: string
  mode: ItemMode
  /** Reps, or seconds when mode is 'time'. */
  target: number
  /** Sets for a straight block; a circuit uses the block's rounds instead. */
  sets: number
  /** Rest after each set of this item, in seconds. */
  restAfter: number
  /** Seconds per phase, e.g. "2·0·1" (down · hold · up). Shown in the player; drives the time estimate. */
  tempo?: string
}

export interface Block {
  id: string
  name: string
  type: 'straight' | 'circuit'
  rounds: number
  /** Warm-up / cool-down blocks render dim in the session bar. Omitted = main work. */
  phase?: 'warmup' | 'cooldown'
  items: WorkoutItem[]
}

export interface Workout {
  id: string
  name: string
  /** Short eyebrow tag, e.g. "Upper". */
  focus: string
  blocks: Block[]
  /** Single-exercise workout made by "Try it" on Exercise detail; kept out of Today's lists. */
  adHoc?: true
}

export interface SessionSet {
  exerciseId: string
  blockId: string
  setIndex: number
  reps?: number
  seconds?: number
  completedAt: number
}

export interface Session {
  id: string
  workoutId: string
  startedAt: number
  endedAt?: number
  /** Time spent working out, excluding pauses; written when the session finishes. */
  activeMs?: number
  effort?: number
  sets: SessionSet[]
}

export interface Settings {
  id: 'settings'
  /** Seconds. */
  defaultRest: number
  /** Sessions per week. */
  weeklyGoal: number
  beeps: boolean
  wakeLock: boolean
  theme: ThemePref
}
