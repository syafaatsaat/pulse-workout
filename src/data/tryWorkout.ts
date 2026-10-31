import type { Exercise, Workout } from './types'

/**
 * The single-exercise workout behind "Try it": 3 sets with the default rest. Holds and stretches
 * run 30 s, everything else 10 reps. One per exercise (stable id), kept out of Today's lists.
 */
export function tryWorkout(exercise: Exercise, restSeconds: number): Workout {
  const timed = exercise.force === 'static' || exercise.category === 'stretching'
  return {
    id: `try-${exercise.id}`,
    name: exercise.name,
    focus: 'Try it',
    adHoc: true,
    blocks: [
      {
        id: 'try',
        name: 'Try it',
        type: 'straight',
        rounds: 1,
        items: [
          {
            id: 'try-item',
            exerciseId: exercise.id,
            mode: timed ? 'time' : 'reps',
            target: timed ? 30 : 10,
            sets: 3,
            restAfter: restSeconds,
          },
        ],
      },
    ],
  }
}
