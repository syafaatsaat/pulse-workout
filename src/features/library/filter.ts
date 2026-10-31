import type { Equipment, Exercise, Level } from '../../data/exerciseTypes'

// Library filtering: pure, so the page just renders the result.

/** Muscle chips, grouping free-exercise-db's 17 muscles. Matched on primary muscles. */
export const MUSCLE_GROUPS = {
  Chest: ['chest'],
  Core: ['abdominals'],
  Legs: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
  Back: ['lats', 'middle back', 'lower back', 'traps'],
  Shoulders: ['shoulders', 'neck'],
  Arms: ['biceps', 'triceps', 'forearms'],
} as const satisfies Record<string, readonly string[]>

export type MuscleGroup = keyof typeof MUSCLE_GROUPS

export const EQUIPMENT: Equipment[] = ['body only', 'bands', 'dumbbell', 'kettlebells']

export interface LibraryFilter {
  query?: string
  group?: MuscleGroup
  /** Empty or absent: all equipment. */
  equipment?: readonly Equipment[]
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Exercises matching every filter, A–Z by name. */
export function filterExercises(
  exercises: Exercise[],
  { query, group, equipment }: LibraryFilter,
): Exercise[] {
  const terms = words(query ?? '')
    .split(' ')
    .filter(Boolean)
  const muscles: readonly string[] | undefined = group && MUSCLE_GROUPS[group]
  return exercises
    .filter((e) => {
      if (muscles && !e.primaryMuscles.some((m) => muscles.includes(m))) return false
      if (equipment?.length && !equipment.includes(e.equipment)) return false
      if (terms.length === 0) return true
      const haystack = words([e.name, ...e.primaryMuscles, ...e.secondaryMuscles, e.equipment].join(' '))
      return terms.every((t) => haystack.includes(t))
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)

/** "Chest · Shoulders": first primary and first secondary muscle. */
export const muscleLine = (e: Exercise) =>
  [e.primaryMuscles[0], e.secondaryMuscles[0]]
    .filter((m) => m !== undefined)
    .map(cap)
    .join(' · ')

export const levelBadge = (level: Level) => ({ beginner: 'BEG', intermediate: 'INT', expert: 'EXP' })[level]

/** ?eq=dumbbell,bands → known equipment only. */
export const parseEquipment = (param: string | null): Equipment[] =>
  (param ?? '').split(',').filter((e): e is Equipment => (EQUIPMENT as string[]).includes(e))

export const isMuscleGroup = (s: string | null): s is MuscleGroup => s !== null && s in MUSCLE_GROUPS
