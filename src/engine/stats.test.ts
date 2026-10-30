import type { Session } from '../data/types'
import { lastTime } from './stats'

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
