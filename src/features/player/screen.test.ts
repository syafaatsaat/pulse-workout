import type { Exercise } from '../../data/types'
import { LEAD_IN_MS, type Step } from '../../engine/compile'
import { initPlayer, playerReducer, type PlayerAction } from '../../engine/playerReducer'
import type { Best, SetValue } from '../../engine/stats'
import { playerScreen } from './screen'

const base = { setCount: 4, blockId: 'b', phase: 'main', moveIndex: 3 } as const
const STEPS: Step[] = [
  { ...base, kind: 'work', exerciseId: 'Pushups', setIndex: 1, target: 12, durationMs: 36_000, mode: 'reps' },
  { ...base, kind: 'rest', exerciseId: 'Pushups', setIndex: 1, target: 30, durationMs: 30_000, mode: 'time' },
  {
    ...base,
    kind: 'work',
    exerciseId: 'Plank',
    setIndex: 0,
    target: 40,
    durationMs: 40_000,
    mode: 'time',
    moveIndex: 4,
  },
]
const exercises = new Map([
  ['Pushups', { id: 'Pushups', name: 'Push-up', instructions: [], images: [] } as unknown as Exercise],
  ['Plank', { id: 'Plank', name: 'Plank', instructions: [], images: [] } as unknown as Exercise],
])
const lastTimes = new Map<string, SetValue>([
  ['Pushups', { reps: 10 }],
  ['Plank', { seconds: 35 }],
])
const T0 = 1_000_000
const bests = new Map<string, Best>([['Pushups', { measure: 'reps', value: 12 }]])

function at(now: number, ...actions: PlayerAction[]) {
  const state = actions.reduce(playerReducer, initPlayer(STEPS))
  return playerScreen(state, state.steps[state.index]!, now, 9, exercises, lastTimes, bests)
}

test('reps: counter, fill of the target, marker at last time, cue and last-time cards', () => {
  const s = at(T0, { type: 'start', now: T0 }, { type: 'adjustReps', delta: -4 })
  expect(s).toMatchObject({
    position: 'Move 4 of 9 · Set 2 of 4',
    title: 'Push-up',
    counter: { text: '08' },
    adjust: 'reps',
    primary: 'setDone',
  })
  expect(s.progress.fill).toBeCloseTo(8 / 12)
  expect(s.progress.marker).toBeCloseTo(10 / 12)
  expect(s.cards).toEqual([
    { label: 'Form cue', value: 'Elbows at 45°, hips level', cue: true },
    { label: 'Last time', value: '10 reps' },
  ])
})

test('rest: the next move with its target, the set just logged, the bar drains', () => {
  const s = at(T0 + 36_000, { type: 'start', now: T0 }, { type: 'setDone', now: T0 + 30_000 })
  expect(s).toMatchObject({
    position: 'Move 4 of 9 · Set 2 of 4 done',
    title: 'Rest',
    tag: 'Up next · Plank · Set 1 of 4',
    counter: { text: '00:24' },
    adjust: 'time',
    primary: 'skipRest',
    progress: { fill: 0.8 },
  })
  expect(s.cards).toEqual([
    { label: 'Next target', value: '00:40' },
    { label: 'Last set', value: '12 reps', newBest: false },
  ])
})

test('rest after a set that beats the best: New best on the last set', () => {
  const s = at(
    T0 + 36_000,
    { type: 'start', now: T0 },
    { type: 'adjustReps', delta: 2 },
    { type: 'setDone', now: T0 + 30_000 },
  )
  expect(s.cards.at(-1)).toEqual({ label: 'Last set', value: '14 reps', newBest: true })
})

test('pulse counts 3-2-1 at the end of a running countdown, never while paused or on reps', () => {
  const resting: PlayerAction[] = [
    { type: 'start', now: T0 },
    { type: 'setDone', now: T0 + 30_000 },
  ]
  expect(at(T0 + 50_000, ...resting).pulse).toBeNull()
  expect(at(T0 + 57_500, ...resting).pulse).toBe(3)
  expect(at(T0 + 59_200, ...resting).pulse).toBe(1)
  expect(at(T0 + 57_500, ...resting, { type: 'pause', now: T0 + 57_500 }).pulse).toBeNull()
  expect(at(T0, { type: 'start', now: T0 }).pulse).toBeNull()
})

test('hold: lead-in first with nothing to adjust, then the hold fills toward last time', () => {
  const actions: PlayerAction[] = [
    { type: 'start', now: T0 },
    { type: 'setDone', now: T0 + 30_000 },
    { type: 'skipRest', now: T0 + 40_000 },
  ]
  const lead = at(T0 + 42_000, ...actions)
  expect(lead).toMatchObject({ tag: 'Get into position', counter: { text: '00:03' }, adjust: null })
  expect(lead.progress.fill).toBe(0)

  const hold = at(T0 + 40_000 + LEAD_IN_MS + 6000, ...actions)
  expect(hold).toMatchObject({
    tag: undefined,
    counter: { text: '00:34' },
    adjust: 'time',
    primary: 'setDone',
  })
  expect(hold.progress.fill).toBeCloseTo(6 / 40)
  expect(hold.progress.marker).toBeCloseTo(35 / 40)
  expect(hold.cards.at(-1)).toEqual({ label: 'Last time', value: '00:35' })
})
