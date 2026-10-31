import type { Exercise, Session, Workout } from '../../data/types'
import { equipmentLabel, isoWeek, moveDoses, shortBlockLabels, upNextWorkout, weekDays } from './today'

const workout = (id: string, extra: Partial<Workout> = {}): Workout => ({
  id,
  name: id,
  focus: 'Upper',
  blocks: [],
  ...extra,
})
const session = (workoutId: string, startedAt: number, finished = true): Session => ({
  id: `${workoutId}-${startedAt}`,
  workoutId,
  startedAt,
  ...(finished ? { endedAt: startedAt + 1 } : {}),
  sets: [],
})

describe('upNextWorkout', () => {
  const ws = [workout('a'), workout('b'), workout('c'), workout('try', { adHoc: true })]

  test('never-done workouts first, in list order', () => {
    expect(upNextWorkout(ws, [session('a', 1)])?.id).toBe('b')
  })

  test('then the one done longest ago; unfinished and ad-hoc sessions are ignored', () => {
    const sessions = [
      session('b', 1),
      session('a', 2),
      session('c', 3),
      session('b', 4, false),
      session('try', 0),
    ]
    expect(upNextWorkout(ws, sessions)?.id).toBe('b')
  })

  test('undefined with no workouts', () => {
    expect(upNextWorkout([workout('t', { adHoc: true })], [])).toBeUndefined()
  })
})

describe('equipmentLabel', () => {
  const ex = (id: string, equipment: Exercise['equipment']) => [id, { equipment } as Exercise] as const
  const exercises = new Map([ex('p', 'body only'), ex('d', 'dumbbell'), ex('b', 'bands')])
  const w = (...ids: string[]) =>
    workout('w', {
      blocks: [
        {
          id: 'b',
          name: 'B',
          type: 'straight',
          rounds: 1,
          items: ids.map((exerciseId, i) => ({
            id: `${i}`,
            exerciseId,
            mode: 'reps',
            target: 1,
            sets: 1,
            restAfter: 0,
          })),
        },
      ],
    })

  test('"No equipment" for bodyweight only, else the kit in order of first use', () => {
    expect(equipmentLabel(w('p', 'p'), exercises)).toBe('No equipment')
    expect(equipmentLabel(w('p', 'd', 'b', 'd'), exercises)).toBe('Dumbbell + bands')
  })
})

describe('weekDays', () => {
  // Thursday 29 Oct 2026, noon.
  const now = new Date(2026, 9, 29, 12).getTime()
  const at = (day: number) => new Date(2026, 9, day, 18).getTime()

  test('Monday to Sunday with done, today and future flags', () => {
    const days = weekDays([session('a', at(26)), session('b', at(28)), session('c', at(27), false)], now)
    expect(days.map((d) => d.date.getDate())).toEqual([26, 27, 28, 29, 30, 31, 1])
    expect(days.map((d) => d.done)).toEqual([true, false, true, false, false, false, false])
    expect(days.map((d) => d.today)).toEqual([false, false, false, true, false, false, false])
    expect(days.map((d) => d.future)).toEqual([false, false, false, false, true, true, true])
  })
})

describe('shortBlockLabels', () => {
  test('Warm / Cool, main blocks lettered with ×N; weights follow the session bar', () => {
    const w = workout('w', {
      blocks: [
        {
          id: 'warm',
          name: 'Warm-up',
          type: 'straight',
          rounds: 1,
          phase: 'warmup',
          items: [{ id: '1', exerciseId: 'x', mode: 'time', target: 60, sets: 1, restAfter: 0 }],
        },
        {
          id: 'a',
          name: 'A',
          type: 'straight',
          rounds: 1,
          items: [{ id: '2', exerciseId: 'y', mode: 'reps', target: 10, sets: 2, restAfter: 30 }],
        },
        {
          id: 'b',
          name: 'B',
          type: 'circuit',
          rounds: 3,
          items: [{ id: '3', exerciseId: 'z', mode: 'reps', target: 10, sets: 1, restAfter: 0 }],
        },
        {
          id: 'cool',
          name: 'Cool-down',
          type: 'straight',
          rounds: 1,
          phase: 'cooldown',
          items: [{ id: '4', exerciseId: 'x', mode: 'time', target: 60, sets: 1, restAfter: 0 }],
        },
      ],
    })
    expect(shortBlockLabels(w)).toEqual([
      { blockId: 'warm', label: 'Warm', weight: 4 },
      { blockId: 'a', label: 'A ×2', weight: 3 + 1 + 3 + 1 }, // work, rest, work, rest
      { blockId: 'b', label: 'B ×3', weight: 9 },
      { blockId: 'cool', label: 'Cool', weight: 3 },
    ])
  })
})

describe('moveDoses', () => {
  const item = (exerciseId: string, mode: 'reps' | 'time', target: number, sets: number) => ({
    id: exerciseId,
    exerciseId,
    mode,
    target,
    sets,
    restAfter: 30,
  })

  test('sets × reps or time per move, circuits use their rounds, long single holds in minutes', () => {
    const w = workout('w', {
      blocks: [
        { id: 'a', name: 'A', type: 'straight', rounds: 1, items: [item('Pushups', 'reps', 10, 2)] },
        {
          id: 'b',
          name: 'B',
          type: 'circuit',
          rounds: 4,
          items: [item('Plank', 'time', 40, 1), item('Squat', 'reps', 12, 1)],
        },
        {
          id: 'c',
          name: 'Cool-down',
          type: 'straight',
          rounds: 1,
          phase: 'cooldown',
          items: [
            item('Stretch', 'time', 240, 1),
            item('Hold', 'time', 30, 1),
            item('Dip', 'reps', 8, 1),
            item('Long', 'time', 90, 1),
          ],
        },
      ],
    })
    expect(moveDoses(w).map((m) => `${m.exerciseId} ${m.dose}`)).toEqual([
      'Pushups 2×10',
      'Plank 4×0:40',
      'Squat 4×12',
      'Stretch 4 min',
      'Hold 0:30',
      'Dip 8 reps',
      'Long 1:30',
    ])
  })
})

describe('isoWeek', () => {
  test('ISO 8601 week numbers, including the year edges', () => {
    expect(isoWeek(new Date(2026, 9, 29))).toBe(44)
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1)
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53)
    expect(isoWeek(new Date(2024, 11, 30))).toBe(1)
  })
})
