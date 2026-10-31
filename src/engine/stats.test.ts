import type { Session } from '../data/types'
import {
  activeMs,
  bestOf,
  lastTime,
  monthStats,
  personalBests,
  sessionBests,
  startOfWeek,
  streak,
  weekProgress,
} from './stats'

const session = (id: string, startedAt: number, sets: Session['sets'], finished = true): Session => ({
  id,
  workoutId: 'w',
  startedAt,
  ...(finished ? { endedAt: startedAt + 1 } : {}),
  sets,
})
const set = (exerciseId: string, v: { reps?: number; seconds?: number }) => ({
  exerciseId,
  blockId: 'a',
  setIndex: 0,
  completedAt: 0,
  ...v,
})

describe('lastTime', () => {
  const sessions = [
    session('old', 100, [set('Pushups', { reps: 15 })]),
    session('recent', 200, [
      set('Pushups', { reps: 9 }),
      set('Pushups', { reps: 11 }),
      set('Plank', { seconds: 45 }),
    ]),
    session('unfinished', 300, [set('Pushups', { reps: 30 })], false),
    session('current', 400, [set('Pushups', { reps: 1 })]),
  ]

  test('best set of the most recent finished session before this one', () => {
    expect(lastTime(sessions, 'Pushups', 'current')).toEqual({ reps: 11 })
    expect(lastTime(sessions, 'Plank', 'current')).toEqual({ seconds: 45 })
  })

  test('undefined when the move was never done', () => {
    expect(lastTime(sessions, 'Dead_Bug', 'current')).toBeUndefined()
  })
})

// Local dates: weeks start on Monday at local midnight. 29 Oct 2026 is a Thursday.
const at = (month: number, day: number, hour = 18) => new Date(2026, month - 1, day, hour).getTime()
const NOW = at(10, 29, 12)
const on = (id: string, month: number, day: number, sets: Session['sets'] = []) =>
  session(id, at(month, day), sets)

describe('startOfWeek', () => {
  test('is local midnight of the Monday', () => {
    expect(startOfWeek(NOW)).toEqual(new Date(2026, 9, 26))
    expect(startOfWeek(at(11, 1))).toEqual(new Date(2026, 9, 26)) // Sunday
    expect(startOfWeek(at(10, 26, 0))).toEqual(new Date(2026, 9, 26))
  })
})

describe('bestOf', () => {
  test('most reps when the sets are reps, longest hold when timed', () => {
    expect(bestOf([set('P', { reps: 9 }), set('P', { reps: 12 })])).toEqual({ measure: 'reps', value: 12 })
    expect(bestOf([set('K', { seconds: 30 }), set('K', { seconds: 45 })])).toEqual({
      measure: 'seconds',
      value: 45,
    })
    expect(bestOf([])).toBeUndefined()
  })
})

describe('sessionBests', () => {
  const history = [
    on('a', 10, 1, [set('Pushups', { reps: 10 }), set('Plank', { seconds: 60 })]),
    on('b', 10, 8, [set('Pushups', { reps: 9 })]),
    session('unfinished', at(10, 9), [set('Pushups', { reps: 40 })], false),
  ]
  const today = on('today', 10, 15, [
    set('Pushups', { reps: 11 }),
    set('Pushups', { reps: 12 }),
    set('Plank', { seconds: 45 }),
    set('Squat', { reps: 20 }),
  ])
  const later = on('later', 10, 22, [set('Pushups', { reps: 30 })])

  test('one row per move, in the order done, against the best before this session', () => {
    expect(sessionBests([...history, today, later], today)).toEqual([
      {
        exerciseId: 'Pushups',
        sets: 2,
        best: { measure: 'reps', value: 12 },
        previous: { measure: 'reps', value: 10 },
        isNew: true,
      },
      {
        exerciseId: 'Plank',
        sets: 1,
        best: { measure: 'seconds', value: 45 },
        previous: { measure: 'seconds', value: 60 },
        isNew: false,
      },
      // First time: nothing to beat, so not a new best.
      { exerciseId: 'Squat', sets: 1, best: { measure: 'reps', value: 20 }, isNew: false },
    ])
  })

  test('equalling the best is not a new best', () => {
    const tie = on('tie', 10, 15, [set('Pushups', { reps: 10 })])
    expect(sessionBests([...history, tie], tie)[0]?.isNew).toBe(false)
  })
})

describe('personalBests', () => {
  test('current best per move, when it was set and what it beat; newest first', () => {
    const sessions = [
      on('a', 9, 20, [set('Pushups', { reps: 8 }), set('Plank', { seconds: 40 })]),
      on('b', 10, 1, [set('Pushups', { reps: 10 })]),
      on('c', 10, 8, [set('Plank', { seconds: 55 })]),
      on('d', 10, 15, [set('Pushups', { reps: 12 }), set('Squat', { reps: 20 })]),
      on('e', 10, 22, [set('Pushups', { reps: 12 })]), // ties don't move the date
      session('open', at(10, 28), [set('Squat', { reps: 99 })], false),
    ]
    expect(personalBests(sessions)).toEqual([
      {
        exerciseId: 'Pushups',
        best: { measure: 'reps', value: 12 },
        previous: { measure: 'reps', value: 10 },
        sessionId: 'd',
        setAt: at(10, 15),
      },
      { exerciseId: 'Squat', best: { measure: 'reps', value: 20 }, sessionId: 'd', setAt: at(10, 15) },
      {
        exerciseId: 'Plank',
        best: { measure: 'seconds', value: 55 },
        previous: { measure: 'seconds', value: 40 },
        sessionId: 'c',
        setAt: at(10, 8),
      },
    ])
  })
})

describe('weekly goal', () => {
  const sessions = [
    // Week of 28 Sep: 4
    on('s1', 9, 28),
    on('s2', 9, 30),
    on('s3', 10, 1),
    on('s4', 10, 3),
    // Week of 5 Oct: 2 (missed)
    on('s5', 10, 5),
    on('s6', 10, 8),
    // Week of 12 Oct: 4, two on one day
    on('s7', 10, 12),
    on('s8', 10, 12),
    on('s9', 10, 14),
    on('s10', 10, 16),
    // Week of 19 Oct: 5
    on('s11', 10, 19),
    on('s12', 10, 20),
    on('s13', 10, 21),
    on('s14', 10, 23),
    on('s15', 10, 25),
    // This week (26 Oct): 2 so far, plus one unfinished
    on('s16', 10, 26),
    on('s17', 10, 28),
    session('open', at(10, 29, 8), [], false),
  ]

  test('weekProgress counts finished sessions this week', () => {
    expect(weekProgress(sessions, NOW)).toBe(2)
  })

  test('streak: weeks in a row meeting the goal; an unfinished week does not break it', () => {
    expect(streak(sessions, 4, NOW)).toBe(2)
    expect(streak(sessions, 2, NOW)).toBe(5) // this week already counts once met
    expect(streak(sessions, 6, NOW)).toBe(0)
    expect(streak([], 4, NOW)).toBe(0)
  })

  test('streak is 0 once a whole week is missed', () => {
    expect(streak(sessions, 4, at(11, 9, 12))).toBe(0)
  })

  test('monthStats: totals for the calendar month, weekly figures for weeks starting in it', () => {
    const m = monthStats(sessions, 2026, 9, 4, NOW) // October
    expect(m.sessions).toBe(15) // s3…s17
    expect(m.weeks).toBe(4) // 5, 12, 19, 26 Oct
    expect(m.goalWeeks).toBe(2) // 12 and 19 Oct
    expect(m.avgPerWeek).toBe(3.25) // (2 + 4 + 5 + 2) / 4
    expect(m.days.get(12)).toBe('s8') // latest of the day
    expect(m.days.has(29)).toBe(false) // unfinished
    expect(m.activeMs).toBe(15) // test sessions last 1 ms each
  })

  test('monthStats: weeks that have not started yet are left out', () => {
    expect(monthStats(sessions, 2026, 10, 4, NOW)).toMatchObject({ sessions: 0, weeks: 0, avgPerWeek: 0 })
  })
})

describe('activeMs', () => {
  test('uses the stored active time, else end minus start', () => {
    expect(activeMs({ ...session('x', 1000, []), endedAt: 61_000 })).toBe(60_000)
    expect(activeMs({ ...session('x', 1000, []), endedAt: 61_000, activeMs: 50_000 })).toBe(50_000)
  })
})
