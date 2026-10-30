import type { Block, ItemMode, Workout, WorkoutItem } from './types'

// The 5 ready-made workouts. Every exerciseId is a free-exercise-db id kept by the import.

let n = 0
function item(
  exerciseId: string,
  mode: ItemMode,
  target: number,
  sets = 1,
  restAfter = 30,
  tempo?: string,
): WorkoutItem {
  return { id: `i${++n}`, exerciseId, mode, target, sets, restAfter, ...(tempo ? { tempo } : {}) }
}
const reps = (id: string, target: number, sets?: number, rest?: number, tempo?: string) =>
  item(id, 'reps', target, sets, rest, tempo)
const time = (id: string, seconds: number, sets?: number, rest?: number) =>
  item(id, 'time', seconds, sets, rest)

function block(id: string, name: string, items: WorkoutItem[], opts: Partial<Block> = {}): Block {
  return { id, name, type: 'straight', rounds: 1, items, ...opts }
}

export const DEMO_WORKOUTS: Workout[] = [
  {
    // Matches F-Today / F-Player: 9 moves; warm-up and cool-down are one step each; block B runs
    // each move's 4 sets back to back (player: Push-up set 2 → rest → set 3 → next move).
    id: 'push-and-core',
    name: 'Push & Core',
    focus: 'Upper',
    blocks: [
      block('warm', 'Warm-up', [time('Inchworm', 180, 1, 15)], { phase: 'warmup' }),
      block('a', 'Warm', [reps('Incline_Push-Up', 10, 2, 30, '2·0·1'), reps('Dead_Bug', 12, 2, 30)]),
      block('b', 'Main circuit', [
        reps('Pushups', 12, 4, 30, '2·0·1'),
        reps('Push-Ups_With_Feet_Elevated', 8, 4, 30, '2·0·1'),
        time('Plank', 40, 4, 30),
      ]),
      block('c', 'Finisher', [reps('Bench_Dips', 10, 3, 30, '2·0·1'), time('Flutter_Kicks', 30, 3)]),
      block('cool', 'Cool-down', [time('Childs_Pose', 240, 1, 0)], { phase: 'cooldown' }),
    ],
  },
  {
    id: 'core-10',
    name: '10-min core',
    focus: 'Core',
    blocks: [
      block(
        'a',
        'Core circuit',
        [
          reps('Crunches', 15, 1, 15),
          reps('Dead_Bug', 12, 1, 15),
          reps('Russian_Twist', 20, 1, 15),
          time('Plank', 40, 1, 15),
          time('Flutter_Kicks', 30, 1, 15),
          reps('Reverse_Crunch', 12, 1, 15),
        ],
        { type: 'circuit', rounds: 2 },
      ),
    ],
  },
  {
    id: 'full-body-20',
    name: '20-min full body',
    focus: 'Full body',
    blocks: [
      block(
        'a',
        'Full body circuit',
        [
          reps('Bodyweight_Squat', 15, 1, 20),
          reps('Pushups', 10, 1, 20),
          reps('Bodyweight_Walking_Lunge', 12, 1, 20),
          reps('Butt_Lift_Bridge', 15, 1, 20),
          time('Mountain_Climbers', 30, 1, 20),
          reps('Superman', 12, 1, 20),
          time('Plank', 40, 1, 20),
          reps('Freehand_Jump_Squat', 10, 1, 20),
        ],
        { type: 'circuit', rounds: 3 },
      ),
    ],
  },
  {
    id: 'mobility-reset',
    name: 'Mobility reset',
    focus: 'Mobility',
    blocks: [
      block('a', 'Flow', [
        time('Cat_Stretch', 45, 1, 10),
        time('Standing_Hip_Circles', 45, 1, 10),
        time('Worlds_Greatest_Stretch', 60, 1, 10),
        time('Kneeling_Hip_Flexor', 45, 2, 10),
        time('Hamstring_Stretch', 45, 2, 10),
        time('Spinal_Stretch', 45, 1, 10),
        time('Shoulder_Stretch', 45, 2, 10),
        time('Childs_Pose', 60, 1, 10),
        time('Hug_Knees_To_Chest', 45, 1, 0),
      ]),
    ],
  },
  {
    id: 'legs-and-glutes',
    name: 'Legs & glutes',
    focus: 'Lower',
    blocks: [
      block('warm', 'Warm-up', [time('Standing_Hip_Circles', 120, 1, 15)], { phase: 'warmup' }),
      block('a', 'Strength', [
        reps('Goblet_Squat', 12, 4, 45, '3·1·1'),
        reps('Single_Leg_Glute_Bridge', 12, 3),
        reps('Bodyweight_Walking_Lunge', 12, 3),
      ]),
      block(
        'b',
        'Burnout',
        [reps('Glute_Kickback', 15), reps('Step-up_with_Knee_Raise', 10), reps('Freehand_Jump_Squat', 10)],
        { type: 'circuit', rounds: 3 },
      ),
      block('cool', 'Cool-down', [time('Hamstring_Stretch', 180, 1, 0)], { phase: 'cooldown' }),
    ],
  },
]
