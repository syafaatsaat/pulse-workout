import { stepWeight } from '../../components/stepWeight'
import type { Exercise, Session, Workout } from '../../data/types'
import { compile } from '../../engine/compile'
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

/**
 * Labels under the Today session bar: Warm / Cool, main blocks lettered with ×N when every move
 * runs N sets. `weight` is the block's share of the bar, so each label sits under its block.
 */
export function shortBlockLabels(workout: Workout): { blockId: string; label: string; weight: number }[] {
  const steps = compile(workout)
  let letter = 0
  return workout.blocks.map((block) => {
    const weight = steps.filter((s) => s.blockId === block.id).reduce((sum, s) => sum + stepWeight(s), 0)
    if (block.phase) return { blockId: block.id, label: block.phase === 'warmup' ? 'Warm' : 'Cool', weight }
    const sets = block.type === 'circuit' ? [block.rounds] : [...new Set(block.items.map((i) => i.sets))]
    const times = sets.length === 1 && sets[0]! > 1 ? ` ×${sets[0]}` : ''
    return { blockId: block.id, label: `${String.fromCharCode(65 + letter++)}${times}`, weight }
  })
}
