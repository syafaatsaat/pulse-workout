import type { Exercise } from './types'
import { tryWorkout } from './tryWorkout'

const ex = (extra: Partial<Exercise>): Exercise => ({
  id: 'Pushups',
  name: 'Pushups',
  level: 'beginner',
  equipment: 'body only',
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  instructions: [],
  images: [],
  ...extra,
})

test('3 × 10 reps with the default rest, flagged ad hoc', () => {
  expect(tryWorkout(ex({}), 45)).toEqual({
    id: 'try-Pushups',
    name: 'Pushups',
    focus: 'Try it',
    adHoc: true,
    blocks: [
      {
        id: 'try',
        name: 'Try it',
        type: 'straight',
        rounds: 1,
        items: [{ id: 'try-item', exerciseId: 'Pushups', mode: 'reps', target: 10, sets: 3, restAfter: 45 }],
      },
    ],
  })
})

test('holds and stretches are timed: 3 × 30 s', () => {
  for (const e of [ex({ force: 'static' }), ex({ category: 'stretching' })]) {
    expect(tryWorkout(e, 30).blocks[0]!.items[0]).toMatchObject({ mode: 'time', target: 30, sets: 3 })
  }
})
