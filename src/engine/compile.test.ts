import { DEMO_WORKOUTS } from '../data/demoWorkouts'
import type { Workout } from '../data/types'
import { compile, estimateMs, moveCount, REP_MS_DEFAULT, tempoMs } from './compile'

const straight: Workout = {
  id: 'w',
  name: 'Straight',
  focus: '',
  blocks: [
    {
      id: 'a',
      name: 'A',
      type: 'straight',
      rounds: 1,
      items: [
        { id: 'i1', exerciseId: 'Pushups', mode: 'reps', target: 10, sets: 2, restAfter: 30, tempo: '2·0·1' },
        { id: 'i2', exerciseId: 'Plank', mode: 'time', target: 40, sets: 1, restAfter: 20 },
      ],
    },
  ],
}

const circuit: Workout = {
  id: 'c',
  name: 'Circuit',
  focus: '',
  blocks: [
    {
      id: 'warm',
      name: 'Warm-up',
      type: 'straight',
      rounds: 1,
      phase: 'warmup',
      items: [{ id: 'w1', exerciseId: 'Inchworm', mode: 'time', target: 120, sets: 1, restAfter: 0 }],
    },
    {
      id: 'b',
      name: 'B',
      type: 'circuit',
      rounds: 2,
      items: [
        { id: 'b1', exerciseId: 'Crunches', mode: 'reps', target: 15, sets: 99, restAfter: 15 },
        { id: 'b2', exerciseId: 'Plank', mode: 'time', target: 30, sets: 99, restAfter: 15 },
      ],
    },
  ],
}

const brief = (w: Workout) =>
  compile(w).map((s) => `${s.kind}:${s.exerciseId}:${s.setIndex + 1}/${s.setCount}:${s.target}`)

describe('compile', () => {
  test('straight block: all sets of a move, then the next; rest after every set except the last step', () => {
    expect(brief(straight)).toEqual([
      'work:Pushups:1/2:10',
      'rest:Pushups:1/2:30',
      'work:Pushups:2/2:10',
      'rest:Pushups:2/2:30',
      'work:Plank:1/1:40',
    ])
  })

  test('circuit block: one set of each move per round; rounds are the set count; item.sets is ignored', () => {
    expect(brief(circuit)).toEqual([
      'work:Inchworm:1/1:120',
      'work:Crunches:1/2:15',
      'rest:Crunches:1/2:15',
      'work:Plank:1/2:30',
      'rest:Plank:1/2:15',
      'work:Crunches:2/2:15',
      'rest:Crunches:2/2:15',
      'work:Plank:2/2:30',
    ])
  })

  test('restAfter 0 adds no rest step', () => {
    expect(compile(circuit)[1]!.kind).toBe('work')
  })

  test('durations: time = seconds, rest = seconds, reps = reps × tempo (or the default per rep)', () => {
    const [pushups, rest] = compile(straight)
    expect(pushups!.durationMs).toBe(10 * 3000)
    expect(rest!.durationMs).toBe(30_000)
    expect(compile(straight)[4]!.durationMs).toBe(40_000)
    expect(compile(circuit)[1]!.durationMs).toBe(15 * REP_MS_DEFAULT)
  })

  test('steps carry block, phase, move ordinal, mode and tempo', () => {
    const steps = compile(circuit)
    expect(steps[0]).toMatchObject({ blockId: 'warm', phase: 'warmup', moveIndex: 0, mode: 'time' })
    expect(steps[3]).toMatchObject({ blockId: 'b', phase: 'main', moveIndex: 2, mode: 'time' })
    expect(compile(straight)[0]).toMatchObject({ tempo: '2·0·1', mode: 'reps' })
    expect(compile(straight)[1]).toMatchObject({ kind: 'rest', mode: 'time', moveIndex: 0 })
  })

  test('Push & Core reads like the mock-up: move 4 of 9 is push-ups, set 2 is followed by rest then set 3', () => {
    const w = DEMO_WORKOUTS.find((x) => x.id === 'push-and-core')!
    const steps = compile(w)
    expect(moveCount(w)).toBe(9)
    const i = steps.findIndex((s) => s.kind === 'work' && s.exerciseId === 'Pushups' && s.setIndex === 1)
    expect(steps[i]!.moveIndex).toBe(3)
    expect(steps[i]!.setCount).toBe(4)
    expect(steps[i + 1]).toMatchObject({ kind: 'rest', target: 30 })
    expect(steps[i + 2]).toMatchObject({ kind: 'work', exerciseId: 'Pushups', setIndex: 2 })
    const minutes = estimateMs(steps) / 60_000
    expect(minutes).toBeGreaterThan(22)
    expect(minutes).toBeLessThan(34)
  })

  test('every demo workout compiles to work steps only at the ends', () => {
    for (const w of DEMO_WORKOUTS) {
      const steps = compile(w)
      expect(steps[0]!.kind).toBe('work')
      expect(steps.at(-1)!.kind).toBe('work')
    }
  })
})

describe('tempoMs', () => {
  test('sums the phases of a tempo string', () => {
    expect(tempoMs('2·0·1')).toBe(3000)
    expect(tempoMs('3-1-1')).toBe(5000)
    expect(tempoMs(undefined)).toBe(REP_MS_DEFAULT)
    expect(tempoMs('fast')).toBe(REP_MS_DEFAULT)
  })
})
