import type { Step } from './compile'
import {
  currentStep,
  elapsedMs,
  initPlayer,
  playerReducer,
  remainingMs,
  type PlayerAction,
  type PlayerState,
} from './playerReducer'

const base = { setCount: 2, blockId: 'a', phase: 'main', moveIndex: 0 } as const
const STEPS: Step[] = [
  { ...base, kind: 'work', exerciseId: 'Pushups', setIndex: 0, target: 12, durationMs: 36_000, mode: 'reps' },
  { ...base, kind: 'rest', exerciseId: 'Pushups', setIndex: 0, target: 30, durationMs: 30_000, mode: 'time' },
  {
    ...base,
    kind: 'work',
    exerciseId: 'Plank',
    setIndex: 0,
    target: 40,
    durationMs: 40_000,
    mode: 'time',
    moveIndex: 1,
  },
]

const T0 = 1_000_000

function run(...actions: PlayerAction[]): PlayerState {
  return actions.reduce(playerReducer, initPlayer(STEPS))
}

describe('start', () => {
  test('is ready until started, then runs step 0 with reps preset to the target', () => {
    const ready = initPlayer(STEPS)
    expect(ready.status).toBe('ready')
    const s = playerReducer(ready, { type: 'start', now: T0 })
    expect(s).toMatchObject({ status: 'running', index: 0, startedAt: T0, reps: 12, endsAt: null })
  })

  test('an empty timeline finishes immediately', () => {
    const s = playerReducer(initPlayer([]), { type: 'start', now: T0 })
    expect(s).toMatchObject({ status: 'finished', endedAt: T0 })
  })
})

describe('reps work', () => {
  test('adjustReps changes the count, never below zero', () => {
    let s = run({ type: 'start', now: T0 }, { type: 'adjustReps', delta: -4 })
    expect(s.reps).toBe(8)
    s = playerReducer(s, { type: 'adjustReps', delta: -20 })
    expect(s.reps).toBe(0)
  })

  test('setDone logs the reps and moves to the rest with endsAt = now + rest', () => {
    const s = run(
      { type: 'start', now: T0 },
      { type: 'adjustReps', delta: -2 },
      { type: 'setDone', now: T0 + 30_000 },
    )
    expect(s.sets).toEqual([
      { stepIndex: 0, exerciseId: 'Pushups', blockId: 'a', setIndex: 0, reps: 10, completedAt: T0 + 30_000 },
    ])
    expect(s).toMatchObject({ index: 1, endsAt: T0 + 60_000 })
    expect(currentStep(s)?.kind).toBe('rest')
  })
})

describe('rest', () => {
  const resting = () => run({ type: 'start', now: T0 }, { type: 'setDone', now: T0 + 30_000 })

  test('remaining is computed from the timestamp, not ticks', () => {
    expect(remainingMs(resting(), T0 + 36_000)).toBe(24_000)
    expect(remainingMs(resting(), T0 + 99_000)).toBe(0)
  })

  test('addTime extends the rest', () => {
    const s = playerReducer(resting(), { type: 'addTime', ms: 15_000 })
    expect(s.endsAt).toBe(T0 + 75_000)
  })

  test('skipRest moves on to the next work step', () => {
    const s = playerReducer(resting(), { type: 'skipRest', now: T0 + 40_000 })
    expect(s).toMatchObject({ index: 2, endsAt: T0 + 80_000 })
  })

  test('setDone and adjustReps do nothing during rest', () => {
    const r = resting()
    expect(playerReducer(r, { type: 'setDone', now: T0 + 40_000 })).toBe(r)
    expect(playerReducer(r, { type: 'adjustReps', delta: 1 })).toBe(r)
  })
})

describe('time work', () => {
  const planking = () =>
    run(
      { type: 'start', now: T0 },
      { type: 'setDone', now: T0 + 30_000 },
      { type: 'skipRest', now: T0 + 40_000 },
    )

  test('setDone at zero logs the full target in seconds and finishes the session after the last step', () => {
    const s = playerReducer(planking(), { type: 'setDone', now: T0 + 80_000 })
    expect(s.sets.at(-1)).toMatchObject({ exerciseId: 'Plank', seconds: 40 })
    expect(s).toMatchObject({ status: 'finished', endedAt: T0 + 80_000 })
  })

  test('setDone early logs the seconds actually held', () => {
    const s = playerReducer(planking(), { type: 'setDone', now: T0 + 65_000 })
    expect(s.sets.at(-1)).toMatchObject({ seconds: 25 })
  })

  test('added time counts towards the seconds held', () => {
    const s = run(
      { type: 'start', now: T0 },
      { type: 'setDone', now: T0 + 30_000 },
      { type: 'skipRest', now: T0 + 40_000 },
      { type: 'addTime', ms: 15_000 },
      { type: 'setDone', now: T0 + 95_000 },
    )
    expect(s.sets.at(-1)).toMatchObject({ seconds: 55 })
  })
})

describe('pause / resume', () => {
  test('pause freezes the remaining time; resume sets a new endsAt from it', () => {
    let s = run(
      { type: 'start', now: T0 },
      { type: 'setDone', now: T0 + 30_000 },
      { type: 'pause', now: T0 + 40_000 },
    )
    expect(s).toMatchObject({ status: 'paused', endsAt: null, remainingMs: 20_000 })
    expect(remainingMs(s, T0 + 500_000)).toBe(20_000)
    s = playerReducer(s, { type: 'resume', now: T0 + 100_000 })
    expect(s).toMatchObject({ status: 'running', endsAt: T0 + 120_000, remainingMs: null })
  })

  test('elapsed excludes paused time', () => {
    const s = run(
      { type: 'start', now: T0 },
      { type: 'pause', now: T0 + 10_000 },
      { type: 'resume', now: T0 + 70_000 },
    )
    expect(elapsedMs(s, T0 + 80_000)).toBe(20_000)
    expect(elapsedMs(playerReducer(s, { type: 'pause', now: T0 + 80_000 }), T0 + 999_000)).toBe(20_000)
  })

  test('addTime while paused adds to the frozen remaining time', () => {
    const s = run(
      { type: 'start', now: T0 },
      { type: 'setDone', now: T0 + 30_000 },
      { type: 'pause', now: T0 + 40_000 },
      { type: 'addTime', ms: 15_000 },
    )
    expect(s.remainingMs).toBe(35_000)
  })

  test('no set done or skip while paused; reps can still be adjusted', () => {
    const p = run({ type: 'start', now: T0 }, { type: 'pause', now: T0 + 1000 })
    expect(playerReducer(p, { type: 'setDone', now: T0 + 2000 })).toBe(p)
    expect(playerReducer(p, { type: 'adjustReps', delta: 1 }).reps).toBe(13)
  })
})

describe('end', () => {
  test('ends early, keeps logged sets, freezes elapsed', () => {
    const s = run(
      { type: 'start', now: T0 },
      { type: 'setDone', now: T0 + 30_000 },
      { type: 'end', now: T0 + 35_000 },
    )
    expect(s).toMatchObject({ status: 'finished', endedAt: T0 + 35_000 })
    expect(s.sets).toHaveLength(1)
    expect(elapsedMs(s, T0 + 999_000)).toBe(35_000)
  })

  test('ending while paused does not count the paused time', () => {
    const s = run(
      { type: 'start', now: T0 },
      { type: 'pause', now: T0 + 10_000 },
      { type: 'end', now: T0 + 60_000 },
    )
    expect(elapsedMs(s, T0 + 999_000)).toBe(10_000)
  })

  test('actions after finish are ignored', () => {
    const done = run({ type: 'start', now: T0 }, { type: 'end', now: T0 + 1 })
    expect(playerReducer(done, { type: 'resume', now: T0 + 2 })).toBe(done)
    expect(playerReducer(done, { type: 'start', now: T0 + 2 })).toBe(done)
  })
})
