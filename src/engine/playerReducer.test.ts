import { LEAD_IN_MS, type Step } from './compile'
import {
  currentStep,
  elapsedMs,
  initPlayer,
  leadInMs,
  playerReducer,
  remainingMs,
  restorePlayer,
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
    const s = playerReducer(resting(), { type: 'addTime', ms: 15_000, now: T0 + 36_000 })
    expect(s).toMatchObject({ endsAt: T0 + 75_000, stepMs: 45_000 })
  })

  test('a negative addTime shortens the rest, never below zero', () => {
    const s = playerReducer(resting(), { type: 'addTime', ms: -15_000, now: T0 + 36_000 })
    expect(s).toMatchObject({ endsAt: T0 + 45_000, stepMs: 15_000 })
    const z = playerReducer(resting(), { type: 'addTime', ms: -30_000, now: T0 + 36_000 })
    expect(z).toMatchObject({ endsAt: T0 + 36_000, stepMs: 6000 })
    expect(remainingMs(z, T0 + 36_000)).toBe(0)
  })

  test('skipRest moves on to the next work step; a timed one starts with the lead-in', () => {
    const s = playerReducer(resting(), { type: 'skipRest', now: T0 + 40_000 })
    expect(s).toMatchObject({ index: 2, endsAt: T0 + 40_000 + LEAD_IN_MS + 40_000, stepMs: 40_000 })
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
    const s = playerReducer(planking(), { type: 'setDone', now: T0 + 85_000 })
    expect(s.sets.at(-1)).toMatchObject({ exerciseId: 'Plank', seconds: 40 })
    expect(s).toMatchObject({ status: 'finished', endedAt: T0 + 85_000 })
  })

  test('setDone early logs the seconds actually held', () => {
    const s = playerReducer(planking(), { type: 'setDone', now: T0 + 70_000 })
    expect(s.sets.at(-1)).toMatchObject({ seconds: 25 })
  })

  test('addTime lengthens or shortens the hold', () => {
    const longer = playerReducer(planking(), { type: 'addTime', ms: 15_000, now: T0 + 50_000 })
    expect(longer).toMatchObject({ endsAt: T0 + 100_000, stepMs: 55_000 })
    const shorter = playerReducer(planking(), { type: 'addTime', ms: -15_000, now: T0 + 50_000 })
    expect(shorter).toMatchObject({ endsAt: T0 + 70_000, stepMs: 25_000 })
    const s = playerReducer(shorter, { type: 'setDone', now: T0 + 70_000 })
    expect(s.sets.at(-1)).toMatchObject({ seconds: 25 })
  })

  test('shortening the hold stops at its end and leaves the lead-in alone', () => {
    // At T0 + 80_000: 5 s of the hold left.
    const late = playerReducer(planking(), { type: 'addTime', ms: -15_000, now: T0 + 80_000 })
    expect(late).toMatchObject({ endsAt: T0 + 80_000, stepMs: 35_000 })
    // During the lead-in: the hold can drop to zero, the lead-in still runs out.
    const early = playerReducer(planking(), { type: 'addTime', ms: -60_000, now: T0 + 42_000 })
    expect(early).toMatchObject({ endsAt: T0 + 45_000, stepMs: 0 })
    expect(leadInMs(early, T0 + 42_000)).toBe(3000)
  })

  test('addTime does nothing on reps work', () => {
    const reps = run({ type: 'start', now: T0 })
    expect(playerReducer(reps, { type: 'addTime', ms: 15_000, now: T0 })).toBe(reps)
  })
})

describe('lead-in', () => {
  const planking = () =>
    run(
      { type: 'start', now: T0 },
      { type: 'setDone', now: T0 + 30_000 },
      { type: 'skipRest', now: T0 + 40_000 },
    )

  test('a timed work set gets a 5 s lead-in before its own countdown', () => {
    const s = planking()
    expect(leadInMs(s, T0 + 40_000)).toBe(LEAD_IN_MS)
    expect(leadInMs(s, T0 + 43_000)).toBe(2000)
    expect(remainingMs(s, T0 + 43_000)).toBe(42_000)
    expect(leadInMs(s, T0 + 45_000)).toBe(0)
    expect(remainingMs(s, T0 + 45_000)).toBe(40_000)
  })

  test('reps and rest steps have no lead-in', () => {
    const work = run({ type: 'start', now: T0 })
    expect(leadInMs(work, T0)).toBe(0)
    const rest = playerReducer(work, { type: 'setDone', now: T0 + 30_000 })
    expect(leadInMs(rest, T0 + 30_000)).toBe(0)
    expect(rest.endsAt).toBe(T0 + 60_000)
  })

  test('a timed first step also starts with the lead-in', () => {
    const s = playerReducer(initPlayer(STEPS.slice(2)), { type: 'start', now: T0 })
    expect(s.endsAt).toBe(T0 + LEAD_IN_MS + 40_000)
  })

  test('startNow skips what is left of the lead-in, and only during it', () => {
    const s = playerReducer(planking(), { type: 'startNow', now: T0 + 42_000 })
    expect(s.endsAt).toBe(T0 + 82_000)
    expect(leadInMs(s, T0 + 42_000)).toBe(0)
    expect(playerReducer(s, { type: 'startNow', now: T0 + 50_000 })).toBe(s)
    const reps = run({ type: 'start', now: T0 })
    expect(playerReducer(reps, { type: 'startNow', now: T0 + 1 })).toBe(reps)
  })

  test('set done during the lead-in logs 0 seconds', () => {
    const s = playerReducer(planking(), { type: 'setDone', now: T0 + 42_000 })
    expect(s.sets.at(-1)).toMatchObject({ exerciseId: 'Plank', seconds: 0 })
  })

  test('pausing in the lead-in keeps what is left of it', () => {
    let s = playerReducer(planking(), { type: 'pause', now: T0 + 42_000 })
    expect(leadInMs(s, T0 + 99_000)).toBe(3000)
    s = playerReducer(s, { type: 'resume', now: T0 + 100_000 })
    expect(s.endsAt).toBe(T0 + 103_000 + 40_000)
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
      { type: 'addTime', ms: 15_000, now: T0 + 50_000 },
    )
    expect(s.remainingMs).toBe(35_000)
    expect(playerReducer(s, { type: 'addTime', ms: -60_000, now: T0 + 50_000 }).remainingMs).toBe(0)
  })

  test('no set done or skip while paused; reps can still be adjusted', () => {
    const p = run({ type: 'start', now: T0 }, { type: 'pause', now: T0 + 1000 })
    expect(playerReducer(p, { type: 'setDone', now: T0 + 2000 })).toBe(p)
    expect(playerReducer(p, { type: 'adjustReps', delta: 1 }).reps).toBe(13)
    const r = run(
      { type: 'start', now: T0 },
      { type: 'setDone', now: T0 + 30_000 },
      { type: 'pause', now: T0 + 40_000 },
    )
    expect(playerReducer(r, { type: 'skipRest', now: T0 + 41_000 })).toBe(r)
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

describe('restorePlayer', () => {
  const saved = (exerciseId: string, completedAt: number, v: { reps?: number; seconds?: number }) => ({
    exerciseId,
    blockId: 'a',
    setIndex: 0,
    completedAt,
    ...v,
  })

  test('reopens paused on the work step after the last saved set, skipping the rest in between', () => {
    const s = restorePlayer(STEPS, [saved('Pushups', T0 + 30_000, { reps: 10 })], T0, T0 + 600_000)
    expect(s).toMatchObject({
      status: 'paused',
      index: 2,
      endsAt: null,
      remainingMs: LEAD_IN_MS + 40_000,
      stepMs: 40_000,
    })
    expect(s.sets).toEqual([
      { stepIndex: 0, exerciseId: 'Pushups', blockId: 'a', setIndex: 0, reps: 10, completedAt: T0 + 30_000 },
    ])
  })

  test('elapsed stops at the last saved set; resuming carries on from there', () => {
    const s = restorePlayer(STEPS, [saved('Pushups', T0 + 30_000, { reps: 10 })], T0, T0 + 600_000)
    expect(elapsedMs(s, T0 + 900_000)).toBe(30_000)
    const resumed = playerReducer(s, { type: 'resume', now: T0 + 700_000 })
    expect(resumed.endsAt).toBe(T0 + 700_000 + LEAD_IN_MS + 40_000)
    expect(elapsedMs(resumed, T0 + 705_000)).toBe(35_000)
  })

  test('with no sets saved it waits at the first step with reps preset', () => {
    const s = restorePlayer(STEPS, [], T0, T0 + 5000)
    expect(s).toMatchObject({ status: 'paused', index: 0, reps: 12, startedAt: T0 })
    expect(elapsedMs(s, T0 + 9000)).toBe(0)
  })

  test('with every set saved it is finished at the last set', () => {
    const s = restorePlayer(
      STEPS,
      [saved('Pushups', T0 + 30_000, { reps: 10 }), saved('Plank', T0 + 80_000, { seconds: 40 })],
      T0,
      T0 + 600_000,
    )
    expect(s).toMatchObject({ status: 'finished', endedAt: T0 + 80_000 })
  })
})
