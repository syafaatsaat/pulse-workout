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
    needsSetup: true,
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

test('reps: counter, fill of the target, marker at last time, one line with last time', () => {
  const s = at(T0, { type: 'start', now: T0 }, { type: 'adjustReps', delta: -4 })
  expect(s).toMatchObject({
    position: 'Move 4 of 9 · Set 2 of 4',
    header: 'Move 4 of 9 · Set 2 of 4',
    title: 'Push-up',
    counter: { kind: 'reps', text: '08' },
    adjust: 'reps',
    addTime: false,
    primary: 'setDone',
    line: { text: 'Last time 10 reps', dot: 'accent' },
  })
  expect(s.progress.fill).toBeCloseTo(8 / 12)
  expect(s.progress.marker).toBeCloseTo(10 / 12)
  expect(s.progress.label).toBe('8 of 12 reps; last time 10')
})

test('rest: the next move in the chip, its target in the line, +15s only, the bar drains', () => {
  const s = at(T0 + 36_000, { type: 'start', now: T0 }, { type: 'setDone', now: T0 + 30_000 })
  expect(s).toMatchObject({
    position: 'Move 4 of 9 · Set 2 of 4 done',
    header: 'Set 2 of 4 done',
    title: 'Rest',
    media: { name: 'Plank' },
    tag: 'Up next · Plank',
    counter: { kind: 'time', text: '00:24' },
    adjust: null,
    addTime: true,
    primary: 'skipRest',
    progress: { fill: 0.8 },
    line: { text: 'Next set: 00:40' },
    newBest: false,
  })
})

test('rest after a set that beats the best: New best on the last set', () => {
  const s = at(
    T0 + 36_000,
    { type: 'start', now: T0 },
    { type: 'adjustReps', delta: 2 },
    { type: 'setDone', now: T0 + 30_000 },
  )
  expect(s.newBest).toBe(true)
  expect(s.line).toEqual({ text: 'New best · 14 reps', dot: 'accent' })
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

test('hold: get into position first, filling over 5 s, then the hold fills toward last time', () => {
  const actions: PlayerAction[] = [
    { type: 'start', now: T0 },
    { type: 'setDone', now: T0 + 30_000 },
    { type: 'skipRest', now: T0 + 40_000 },
  ]
  const lead = at(T0 + 42_000, ...actions)
  expect(lead.tag).toBeUndefined()
  expect(lead).toMatchObject({
    counter: { kind: 'ready', text: 'Get into position' },
    adjust: null,
    addTime: false,
    primary: 'startNow',
    line: { text: 'Timer starts when the line fills' },
  })
  expect(lead.progress.fill).toBeCloseTo(2 / 5)
  expect(lead.progress.marker).toBeUndefined()

  const hold = at(T0 + 40_000 + LEAD_IN_MS + 6000, ...actions)
  expect(hold.tag).toBeUndefined()
  expect(hold).toMatchObject({
    counter: { kind: 'time', text: '00:34' },
    adjust: null,
    addTime: false,
    primary: 'setDone',
  })
  expect(hold.progress.fill).toBeCloseTo(6 / 40)
  expect(hold.progress.marker).toBeCloseTo(35 / 40)
  expect(hold.line).toEqual({ text: 'Last time 00:35', dot: 'accent' })
})
