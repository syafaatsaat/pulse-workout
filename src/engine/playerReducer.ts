import { LEAD_IN_MS, type Step } from './compile'

// Pure player state machine over a compiled timeline. No React, no side effects:
// every action that depends on time carries `now`, and timers are stored as timestamps.

export type PlayerStatus = 'ready' | 'running' | 'paused' | 'finished'

export interface LoggedSet {
  stepIndex: number
  exerciseId: string
  blockId: string
  setIndex: number
  reps?: number
  seconds?: number
  completedAt: number
}

export interface PlayerState {
  steps: Step[]
  status: PlayerStatus
  index: number
  startedAt: number | null
  endedAt: number | null
  /**
   * Timed step (rest or time work) while running: when it hits zero. Time work also includes the
   * lead-in, so anything left beyond `stepMs` is the "get into position" countdown.
   */
  endsAt: number | null
  /** Timed step while paused: what was left at the pause. */
  remainingMs: number | null
  /** Timed step: planned length plus any time added to a rest. */
  stepMs: number
  pausedAt: number | null
  /** Total paused time, excluded from elapsed. */
  pausedMs: number
  /** Counter for the current reps step; preset to the target. */
  reps: number
  sets: LoggedSet[]
}

export type PlayerAction =
  | { type: 'start'; now: number }
  | { type: 'setDone'; now: number }
  | { type: 'adjustReps'; delta: number }
  | { type: 'skipRest'; now: number }
  | { type: 'startNow'; now: number }
  | { type: 'addTime'; ms: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'end'; now: number }

export function initPlayer(steps: Step[]): PlayerState {
  return {
    steps,
    status: 'ready',
    index: 0,
    startedAt: null,
    endedAt: null,
    endsAt: null,
    remainingMs: null,
    stepMs: 0,
    pausedAt: null,
    pausedMs: 0,
    reps: 0,
    sets: [],
  }
}

/**
 * Rebuilds the state of an interrupted session from its saved sets (saved in timeline order).
 * It reopens paused on the next work step — a rest that was running is skipped — with elapsed
 * frozen at the last saved set, so the Resume tap carries on from there.
 */
export function restorePlayer(
  steps: Step[],
  saved: Omit<LoggedSet, 'stepIndex'>[],
  startedAt: number,
  now: number,
): PlayerState {
  const workIndexes = steps.flatMap((s, i) => (s.kind === 'work' ? [i] : []))
  const sets: LoggedSet[] = saved
    .slice(0, workIndexes.length)
    .map((set, i) => ({ ...set, stepIndex: workIndexes[i]! }))
  const lastActivity = sets.at(-1)?.completedAt ?? startedAt
  const base: PlayerState = { ...initPlayer(steps), startedAt, sets }
  const nextIndex = workIndexes[sets.length]

  if (nextIndex === undefined) {
    return { ...base, index: steps.length, status: 'finished', endedAt: lastActivity }
  }
  const entered = enter(base, nextIndex, now)
  return {
    ...entered,
    status: 'paused',
    pausedAt: now,
    pausedMs: now - lastActivity,
    remainingMs: entered.endsAt === null ? null : entered.endsAt - now,
    endsAt: null,
  }
}

export function currentStep(state: PlayerState): Step | undefined {
  return state.steps[state.index]
}

const isTimed = (step: Step) => step.kind === 'rest' || step.mode === 'time'

/** Time left on the current timed step; null for a reps step. */
export function remainingMs(state: PlayerState, now: number): number | null {
  if (state.remainingMs !== null) return state.remainingMs
  if (state.endsAt !== null) return Math.max(0, state.endsAt - now)
  return null
}

/** What is left of the "get into position" lead-in of a timed work set; 0 otherwise. */
export function leadInMs(state: PlayerState, now: number): number {
  const step = currentStep(state)
  if (step?.kind !== 'work' || step.mode !== 'time') return 0
  return Math.max(0, (remainingMs(state, now) ?? 0) - state.stepMs)
}

/** Session time so far, excluding pauses. */
export function elapsedMs(state: PlayerState, now: number): number {
  if (state.startedAt === null) return 0
  const until = state.endedAt ?? state.pausedAt ?? now
  return Math.max(0, until - state.startedAt - state.pausedMs)
}

/** Enter step `index` at `now`, or finish when past the last step. */
function enter(state: PlayerState, index: number, now: number): PlayerState {
  const step = state.steps[index]
  if (!step) {
    return { ...state, index, status: 'finished', endedAt: now, endsAt: null, remainingMs: null, stepMs: 0 }
  }
  const timed = isTimed(step)
  const leadIn = step.kind === 'work' && timed ? LEAD_IN_MS : 0
  return {
    ...state,
    index,
    endsAt: timed ? now + leadIn + step.durationMs : null,
    remainingMs: null,
    stepMs: timed ? step.durationMs : 0,
    reps: step.kind === 'work' && step.mode === 'reps' ? step.target : 0,
  }
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  const step = currentStep(state)

  switch (action.type) {
    case 'start': {
      if (state.status !== 'ready') return state
      return enter({ ...state, status: 'running', startedAt: action.now }, 0, action.now)
    }

    case 'setDone': {
      if (state.status !== 'running' || step?.kind !== 'work') return state
      const set: LoggedSet = {
        stepIndex: state.index,
        exerciseId: step.exerciseId,
        blockId: step.blockId,
        setIndex: step.setIndex,
        completedAt: action.now,
      }
      if (step.mode === 'reps') set.reps = state.reps
      else set.seconds = Math.round(Math.max(0, state.stepMs - (remainingMs(state, action.now) ?? 0)) / 1000)
      return enter({ ...state, sets: [...state.sets, set] }, state.index + 1, action.now)
    }

    case 'adjustReps': {
      const active = state.status === 'running' || state.status === 'paused'
      if (!active || step?.kind !== 'work' || step.mode !== 'reps') return state
      return { ...state, reps: Math.max(0, state.reps + action.delta) }
    }

    case 'skipRest': {
      if (state.status !== 'running' || step?.kind !== 'rest') return state
      return enter(state, state.index + 1, action.now)
    }

    case 'startNow': {
      if (state.status !== 'running' || leadInMs(state, action.now) === 0) return state
      return { ...state, endsAt: action.now + state.stepMs }
    }

    case 'addTime': {
      // +15s is for catching your breath; a timed set doesn't get longer mid-hold.
      if (step?.kind !== 'rest') return state
      if (state.status === 'running' && state.endsAt !== null) {
        return { ...state, endsAt: state.endsAt + action.ms, stepMs: state.stepMs + action.ms }
      }
      if (state.status === 'paused' && state.remainingMs !== null) {
        return { ...state, remainingMs: state.remainingMs + action.ms, stepMs: state.stepMs + action.ms }
      }
      return state
    }

    case 'pause': {
      if (state.status !== 'running') return state
      return {
        ...state,
        status: 'paused',
        pausedAt: action.now,
        remainingMs: state.endsAt === null ? null : Math.max(0, state.endsAt - action.now),
        endsAt: null,
      }
    }

    case 'resume': {
      if (state.status !== 'paused' || state.pausedAt === null) return state
      return {
        ...state,
        status: 'running',
        pausedMs: state.pausedMs + (action.now - state.pausedAt),
        pausedAt: null,
        endsAt: state.remainingMs === null ? null : action.now + state.remainingMs,
        remainingMs: null,
      }
    }

    case 'end': {
      if (state.status === 'finished' || state.status === 'ready') return state
      // Ending while paused: the pause doesn't count, so end at the moment of pausing.
      const endedAt = state.pausedAt ?? action.now
      return { ...state, status: 'finished', endedAt, endsAt: null, remainingMs: null }
    }
  }
}
