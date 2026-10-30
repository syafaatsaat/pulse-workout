import type { Session, SessionSet, Workout } from './types'

const WEEKS = 6

/** Small deterministic PRNG (mulberry32) so the demo log is the same on every visit. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Local midnight of the Monday of `date`'s week. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

// Day offsets (0 = Monday) per completed week: mostly 3–4, one 2, one missed-goal week.
const WEEK_PATTERNS = [
  [0, 2, 4, 5],
  [1, 3, 5],
  [0, 3],
  [0, 2, 4, 6],
  [1, 2, 4, 5],
  [0, 3, 5],
]

/**
 * ~6 weeks of plausible sessions ending before `now`: rotating workouts, evening start times,
 * reps that creep up week on week with some noise. The current week only gets days before today.
 *
 * TODO(Day 2): walk the compiled timeline from engine/compile.ts instead of the blocks directly.
 */
export function generateDemoSessions(workouts: Workout[], now = new Date()): Session[] {
  const rand = rng(44)
  const thisWeek = startOfWeek(now)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const sessions: Session[] = []
  let rotation = 0

  for (let w = 0; w <= WEEKS; w++) {
    const weekStart = new Date(thisWeek)
    weekStart.setDate(weekStart.getDate() - (WEEKS - w) * 7)
    // Current week: Monday and Wednesday so far (like the mock-ups), never today or later.
    const days = w === WEEKS ? [0, 2] : WEEK_PATTERNS[w % WEEK_PATTERNS.length]!

    for (const offset of days) {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + offset)
      if (day.getTime() >= today) continue

      const workout = workouts[rotation++ % workouts.length]!
      const startedAt = day.getTime() + (17.5 + rand() * 2.5) * 60 * 60 * 1000
      const progress = w / WEEKS // 0 → 1 over the six weeks
      let clock = startedAt
      const sets: SessionSet[] = []

      for (const block of workout.blocks) {
        const rounds = block.type === 'circuit' ? block.rounds : 1
        for (let r = 0; r < rounds; r++) {
          for (const item of block.items) {
            const count = block.type === 'circuit' ? 1 : item.sets
            for (let s = 0; s < count; s++) {
              const noise = Math.round(rand() * 3) - 2 // −2…+1
              const set: SessionSet = {
                exerciseId: item.exerciseId,
                blockId: block.id,
                setIndex: block.type === 'circuit' ? r : s,
                completedAt: 0,
              }
              if (item.mode === 'reps') {
                set.reps = Math.max(1, Math.round(item.target * (0.85 + 0.3 * progress)) + noise)
                clock += set.reps * 3000
              } else {
                set.seconds = Math.max(10, Math.round((item.target * (0.85 + 0.35 * progress)) / 5) * 5)
                clock += set.seconds * 1000
              }
              set.completedAt = clock
              sets.push(set)
              clock += item.restAfter * 1000 + rand() * 8000
            }
          }
        }
      }

      sessions.push({
        id: `demo-${sessions.length + 1}`,
        workoutId: workout.id,
        startedAt,
        endedAt: clock,
        sets,
      })
    }
  }

  return sessions
}
