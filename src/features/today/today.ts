import type { Exercise, Session, Workout } from '../../data/types'
import { startOfWeek } from '../../engine/stats'

/** The ready-made workout done longest ago; never-done ones first, in list order. */
export function upNextWorkout(workouts: Workout[], sessions: Session[]): Workout | undefined {
  const last = new Map<string, number>()
  for (const s of sessions) {
    if (s.endedAt === undefined) continue
    last.set(s.workoutId, Math.max(last.get(s.workoutId) ?? -Infinity, s.startedAt))
  }
  let pick: Workout | undefined
  for (const w of workouts) {
    if (w.adHoc) continue
    if (!pick || (last.get(w.id) ?? -Infinity) < (last.get(pick.id) ?? -Infinity)) pick = w
  }
  return pick
}

/** "No equipment" for bodyweight only, else e.g. "Dumbbell + bands" (order of first use). */
export function equipmentLabel(workout: Workout, exercises: Map<string, Exercise>): string {
  const kit = new Set<string>()
  for (const b of workout.blocks) {
    for (const i of b.items) {
      const eq = exercises.get(i.exerciseId)?.equipment
      if (eq && eq !== 'body only') kit.add(eq)
    }
  }
  if (kit.size === 0) return 'No equipment'
  const label = [...kit].join(' + ')
  return label[0]!.toUpperCase() + label.slice(1)
}

export interface WeekDay {
  date: Date
  done: boolean
  today: boolean
  future: boolean
}

/** Monday to Sunday of the week containing `now`; done = a finished session that day. */
export function weekDays(sessions: Session[], now: number): WeekDay[] {
  const monday = startOfWeek(now)
  const doneDays = new Set(
    sessions.filter((s) => s.endedAt !== undefined).map((s) => new Date(s.startedAt).toDateString()),
  )
  const todayKey = new Date(now).toDateString()
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    return {
      date,
      done: doneDays.has(date.toDateString()),
      today: date.toDateString() === todayKey,
      future: date.getTime() > now,
    }
  })
}

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/**
 * Per move, in order: "2 × 10", "4 × 00:40" (circuits count rounds), or for a single set "8 reps",
 * "00:30", "01:30", and whole minutes as "4 min".
 */
export function moveDoses(workout: Workout): { exerciseId: string; dose: string }[] {
  return workout.blocks.flatMap((block) =>
    block.items.map((item) => {
      const sets = block.type === 'circuit' ? block.rounds : item.sets
      const value = item.mode === 'reps' ? String(item.target) : mmss(item.target)
      let dose = `${sets} × ${value}`
      if (sets <= 1) {
        if (item.mode === 'reps') dose = `${item.target} reps`
        else if (item.target >= 60 && item.target % 60 === 0) dose = `${item.target / 60} min`
        else dose = value
      }
      return { exerciseId: item.exerciseId, dose }
    }),
  )
}
